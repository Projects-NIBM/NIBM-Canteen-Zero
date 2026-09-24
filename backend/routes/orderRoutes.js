const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const CanteenCapacity = require('../models/CanteenCapacity');
const { protect, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const CANTEEN_CAPACITY = 40;

const generateSafeToken = async () => {
    for (let attempts = 0; attempts < 10; attempts++) {
        const candidate = Math.floor(1000 + Math.random() * 9000).toString();
        const conflict = await Order.findOne({
            tokenID: candidate,
            status: { $in: ['Paid', 'Preparing', 'Ready'] }
        });
        if (!conflict) return candidate;
    }
    return (Date.now() % 9000 + 1000).toString();
};

const getActiveOccupancyCount = async () => {
    const capacity = await CanteenCapacity.findOne({ identifier: 'main_hall' });
    return capacity ? capacity.occupiedSeats : 0;
};

const getActiveKitchenCount = async () => {
    return await Order.countDocuments({ status: { $in: ['Paid', 'Preparing', 'Ready'] } });
};

const broadcastSystemState = async (req, order = null) => {
    const io = req.app.get('socketio');
    if (!io) return;

    const [activeCount, occupancy] = await Promise.all([
        getActiveKitchenCount(),
        getActiveOccupancyCount()
    ]);

    io.emit('orderCountUpdate', activeCount);
    io.emit('occupancyUpdate', { occupied: occupancy, available: Math.max(0, CANTEEN_CAPACITY - occupancy), total: CANTEEN_CAPACITY });
    io.emit('revenueUpdate');

    if (order) {
        io.emit('orderUpdate', { userId: order.user, orderId: order._id, status: order.status, tokenID: order.tokenID });
    }
};

router.get('/occupancy', async (req, res, next) => {
    try {
        const occupied = await getActiveOccupancyCount();
        res.json({ occupied, total: CANTEEN_CAPACITY, available: Math.max(0, CANTEEN_CAPACITY - occupied) });
    } catch (err) { next(err); }
});

router.get('/active-count', async (req, res, next) => {
    try {
        const count = await getActiveKitchenCount();
        res.json({ count });
    } catch (err) { next(err); }
});

router.post('/create', protect, async (req, res, next) => {
    try {
        const { items, totalAmount, orderType } = req.body;
        const userId = req.user.id;

        if (orderType === 'Dine-In') {
            const lockedCapacity = await CanteenCapacity.findOneAndUpdate(
                { identifier: 'main_hall', occupiedSeats: { $lt: CANTEEN_CAPACITY } },
                { $inc: { occupiedSeats: 1 } },
                { new: true, upsert: true }
            );

            if (!lockedCapacity) {
                return res.status(400).json({ message: "Seating capacity currently full." });
            }
        }

        const newOrder = new Order({
            user: userId,
            items,
            totalAmount,
            orderType,
            status: 'Pending'
        });

        await newOrder.save();
        await broadcastSystemState(req, newOrder);
        res.status(201).json(newOrder);
    } catch (err) { next(err); }
});

router.post('/:id/payment-payload', protect, async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
        if (!order) return res.status(404).json({ message: "Order not found." });

        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_SECRET;
        const amountFormatted = parseFloat(order.totalAmount).toLocaleString('en-us', { minimumFractionDigits: 2 }).replaceAll(',', '');
        const currency = "LKR";

        const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const hash = crypto.createHash('md5')
            .update(merchantId + order._id.toString() + amountFormatted + currency + hashedSecret)
            .digest('hex')
            .toUpperCase();

        res.json({
            sandbox: process.env.NODE_ENV !== 'production',
            merchant_id: merchantId,
            return_url: `${process.env.FRONTEND_URL}/menu`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
            notify_url: `${process.env.BACKEND_URL}/api/orders/payment-ipn`,
            order_id: order._id.toString(),
            items: order.items.map(i => i.name).join(', '),
            amount: amountFormatted,
            currency: currency,
            hash: hash,
            first_name: req.user.name || "Scholar",
            last_name: "Student",
            email: req.user.email,
            phone: "0771234567",
            address: "NIBM Colombo Campus",
            city: "Colombo",
            country: "Sri Lanka"
        });
    } catch (err) { next(err); }
});

router.post('/payment-ipn', express.urlencoded({ extended: true }), async (req, res, next) => {
    try {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = req.body;

        const secret = process.env.PAYHERE_SECRET || '';
        const hashedSecret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
        const expectedHash = crypto.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
            .digest('hex')
            .toUpperCase();

        if (expectedHash !== md5sig) {
            logger.warn({ order_id }, "Security alert: Tampered IPN signature received.");
            return res.status(400).send("Signature verification failed.");
        }

        if (status_code === "2") {
            const order = await Order.findById(order_id);
            if (order && order.status === 'Pending') {
                order.status = 'Paid';
                order.paidAt = new Date();
                order.paymentId = req.body.payment_id || `TX-${Date.now()}`;
                order.tokenID = await generateSafeToken();
                await order.save();

                await broadcastSystemState(req, order);
                const io = req.app.get('socketio');
                if (io) io.emit('newOrderAlert', order);
            }
        }
        res.sendStatus(200);
    } catch (err) { next(err); }
});

router.patch('/:id/status', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const updateFields = { status };
        if (status === 'Preparing') updateFields.preparingAt = new Date();
        if (status === 'Ready') updateFields.readyAt = new Date();

        const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true });
        if (!order) return res.status(404).json({ message: "Order not found." });

        await broadcastSystemState(req, order);
        res.json(order);
    } catch (err) { next(err); }
});

router.patch('/:id/collect', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found." });

        order.status = 'Collected';
        order.collectedAt = new Date();

        if (order.orderType === 'Dine-In') {
            const hasMeal = order.items.some(item => item.category === 'Main Meals');
            const diningDurationMs = hasMeal ? 25 * 60 * 1000 : 12 * 60 * 1000;
            order.seatExpiresAt = new Date(Date.now() + diningDurationMs);
        } else {
            order.seatReleased = true;
        }

        await order.save();
        await broadcastSystemState(req, order);
        res.json({ message: "Order collected.", order });
    } catch (err) { next(err); }
});

router.patch('/:id/extend-seat', protect, async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
        if (!order || order.isExtended || !order.seatExpiresAt) {
            return res.status(400).json({ message: "Extension unavailable or already used." });
        }

        order.isExtended = true;
        order.seatExpiresAt = new Date(order.seatExpiresAt.getTime() + 5 * 60 * 1000);
        await order.save();

        await broadcastSystemState(req, order);
        res.json({ message: "Seat extended by 5 minutes." });
    } catch (err) { next(err); }
});

router.patch('/:id/release-manual', protect, async (req, res, next) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
        if (!order) return res.status(404).json({ message: "Order not found." });

        if (!order.seatReleased && order.orderType === 'Dine-In') {
            order.seatReleased = true;
            await order.save();

            await CanteenCapacity.findOneAndUpdate(
                { identifier: 'main_hall', occupiedSeats: { $gt: 0 } },
                { $inc: { occupiedSeats: -1 } }
            );

            await broadcastSystemState(req, order);
        }

        res.json({ message: "Seat released." });
    } catch (err) { next(err); }
});

router.get('/admin/active', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const orders = await Order.find({
            status: { $in: ['Paid', 'Preparing', 'Ready'] }
        }).sort({ createdAt: 1 });
        res.json(orders);
    } catch (err) { next(err); }
});

router.get('/admin/daily-report', protect, authorize('admin'), async (req, res, next) => {
    try {
        const startOfWindow = new Date();
        startOfWindow.setHours(startOfWindow.getHours() - 24);

        const orders = await Order.find({
            createdAt: { $gte: startOfWindow },
            status: { $ne: 'Pending' }
        });

        let totalRevenue = 0;
        let itemCounts = {};
        let totalPrepTime = 0;
        let fulfilledCount = 0;

        orders.forEach(order => {
            totalRevenue += order.totalAmount;
            order.items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
            });
            if (order.paidAt && order.readyAt) {
                const diff = (new Date(order.readyAt) - new Date(order.paidAt)) / 60000;
                totalPrepTime += diff;
                fulfilledCount++;
            }
        });

        const topItems = Object.entries(itemCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

        res.json({
            date: new Date().toLocaleDateString('en-GB'),
            revenue: totalRevenue,
            orderCount: orders.length,
            avgPrepTime: fulfilledCount > 0 ? Math.round(totalPrepTime / fulfilledCount) : 0,
            topItems
        });
    } catch (err) { next(err); }
});

router.get('/user-history/:userId', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access forbidden." });
        }
        const history = await Order.find({ user: req.params.userId, status: { $ne: 'Pending' } }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) { next(err); }
});

router.get('/user/:userId', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access forbidden." });
        }
        const orders = await Order.find({
            user: req.params.userId,
            status: { $in: ['Paid', 'Preparing', 'Ready', 'Collected'] },
            seatReleased: false
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { next(err); }
});

module.exports = router;
const Order = require('../models/Order');
const CanteenCapacity = require('../models/CanteenCapacity');
const logger = require('../utils/logger');

const initSeatWorker = (io) => {
    setInterval(async () => {
        try {
            const now = new Date();
            const expiredOrders = await Order.find({
                orderType: 'Dine-In',
                seatReleased: false,
                seatExpiresAt: { $lte: now }
            });

            for (const order of expiredOrders) {
                order.seatReleased = true;
                await order.save();

                await CanteenCapacity.findOneAndUpdate(
                    { identifier: 'main_hall', occupiedSeats: { $gt: 0 } },
                    { $inc: { occupiedSeats: -1 } }
                );

                logger.info({ orderId: order._id, tokenID: order.tokenID }, "Seat automatically cleared by background worker");

                if (io) {
                    io.emit('orderUpdate', { userId: order.user, status: 'Expired' });
                }
            }

            if (expiredOrders.length > 0 && io) {
                const capacity = await CanteenCapacity.findOne({ identifier: 'main_hall' });
                const occupied = capacity ? capacity.occupiedSeats : 0;
                const total = capacity ? capacity.totalCapacity : 40;
                io.emit('occupancyUpdate', { occupied, available: Math.max(0, total - occupied), total });
            }
        } catch (err) {
            logger.error({ error: err.message }, "Error executing seat release background worker");
        }
    }, 10000);
};

module.exports = { initSeatWorker };
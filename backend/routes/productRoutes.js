const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Product = require('../models/Product');
const CanteenCapacity = require('../models/CanteenCapacity');
const { validateProduct } = require('../middleware/validator');
const { protect, authorize } = require('../middleware/authMiddleware');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'nibm_canteen_system',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 600, height: 600, crop: 'fill' }]
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const handleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Image exceeds 5MB size limit" });
            }
            return res.status(400).json({ message: `Image processing error: ${err.message}` });
        }
        next();
    });
};

const emitInventorySignal = (req) => {
    const io = req.app.get('socketio');
    if (io) io.emit('inventoryUpdate');
};

router.get('/', async (req, res, next) => {
    try {
        const products = await Product.find({ isAvailable: true }).sort({ category: 1 });
        res.status(200).json(products);
    } catch (err) { next(err); }
});

router.get('/admin-list', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (err) { next(err); }
});

router.post('/', protect, authorize('admin'), handleImageUpload, validateProduct, async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Image asset is required" });
        }
        const data = JSON.parse(req.body.data);
        const newProduct = new Product({ ...data, image: req.file.path });
        await newProduct.save();
        emitInventorySignal(req);
        res.status(201).json(newProduct);
    } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('admin'), handleImageUpload, async (req, res, next) => {
    try {
        const data = JSON.parse(req.body.data);
        const updatePayload = { ...data };
        if (req.file) updatePayload.image = req.file.path;
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product record not found" });
        }
        emitInventorySignal(req);
        res.status(200).json(updatedProduct);
    } catch (err) { next(err); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product record not found" });
        }
        emitInventorySignal(req);
        res.status(200).json({ message: "Product deleted" });
    } catch (err) { next(err); }
});

router.patch('/:id/toggle', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product record not found" });
        }
        product.isAvailable = !product.isAvailable;
        await product.save();
        emitInventorySignal(req);
        res.status(200).json(product);
    } catch (err) { next(err); }
});

router.post('/daily-reset', protect, authorize('admin'), async (req, res, next) => {
    try {
        await Product.updateMany({}, { isAvailable: true });
        await CanteenCapacity.findOneAndUpdate(
            { identifier: 'main_hall' },
            { $set: { occupiedSeats: 0 } },
            { upsert: true }
        );
        emitInventorySignal(req);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('occupancyUpdate', { occupied: 0, available: 40, total: 40 });
        }
        res.status(200).json({ message: "System state reset complete" });
    } catch (err) { next(err); }
});

router.post('/seed', protect, authorize('admin'), async (req, res, next) => {
    try {
        await Product.deleteMany({});
        const products = await Product.insertMany(req.body);
        emitInventorySignal(req);
        res.status(201).json(products);
    } catch (err) { next(err); }
});

module.exports = router;
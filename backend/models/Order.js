const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true }
    }],
    totalAmount: { type: Number, required: true },
    orderType: { type: String, enum: ['Dine-In', 'Takeaway'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Preparing', 'Ready', 'Collected'], default: 'Pending' },
    paymentId: { type: String },
    tokenID: { type: String },
    seatReleased: { type: Boolean, default: false },
    isExtended: { type: Boolean, default: false },
    seatExpiresAt: { type: Date },
    paidAt: { type: Date },
    preparingAt: { type: Date },
    readyAt: { type: Date },
    collectedAt: { type: Date }
}, {
    timestamps: true
});

orderSchema.index({ tokenID: 1, status: 1 });
orderSchema.index({ seatExpiresAt: 1, seatReleased: 1 });

module.exports = mongoose.model('Order', orderSchema);
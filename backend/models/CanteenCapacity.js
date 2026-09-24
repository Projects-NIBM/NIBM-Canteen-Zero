const mongoose = require('mongoose');

const canteenCapacitySchema = new mongoose.Schema({
    identifier: { type: String, default: 'main_hall', unique: true },
    totalCapacity: { type: Number, default: 40 },
    occupiedSeats: { type: Number, default: 0, min: 0 }
});

module.exports = mongoose.model('CanteenCapacity', canteenCapacitySchema);
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Referencing User model
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // Referencing Property model
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Referencing Customer model
    scheduleType: { type: String, enum: ['call', 'meet'], required: true },
    time: { type: String, required: true }, // Could also be a Date type
    date: { type: Date, required: true }
}, {
    timestamps: true
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;

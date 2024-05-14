const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    email: { type: String, required: true },
    packageName: { type: String, required: true },
    subscriptionStatus: { type: String, required: true },
    userId: { type: String, required: true } // Adding userId field to store user identifier
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

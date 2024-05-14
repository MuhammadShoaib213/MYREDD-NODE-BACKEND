const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const Subscription = require('../models/Subscription');
const Property = require('../models/Property');


router.post('/subscriptions', subscriptionController.addSubscription);

router.get('/subscriptions/check-limit/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const subscription = await Subscription.findOne({ userId });
        const propertiesCount = await Property.countDocuments({ userId });

        let limit = 0;
        if (subscription.packageName === "Agent Basic Plan") {
            limit = 10;
        } else if (subscription.packageName === "Agent Premium Plan") {
            limit = 100;
        }

        const limitReached = propertiesCount >= limit;
        console.log("Limit Reached:", limitReached); // Correctly log the status here
        console.log("propertiesCount", propertiesCount);
        res.send({ limitReached: limitReached, subscriptionType: subscription.packageName });
    } catch (error) {
        console.error('Error checking property limit:', error);
        res.status(500).send('Error checking property limit');
    }
});


module.exports = router;

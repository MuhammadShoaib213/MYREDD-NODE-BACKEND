const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const Subscription = require('../models/Subscription');
const Property = require('../models/Property');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/subscriptions', authenticateToken, asyncHandler(subscriptionController.addSubscription));

router.get('/subscriptions/check-limit', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    try {
        const subscription = await Subscription.findOne({ userId });
        const propertiesCount = await Property.countDocuments({ userId });

        let limit = 0;
        const packageName = subscription?.packageName || '';
        if (packageName === "Agent Basic Plan") {
            limit = 10;
        } else if (packageName === "Agent Premium Plan") {
            limit = 100;
        }

        const limitReached = propertiesCount >= limit;
        console.log("Limit Reached:", limitReached); // Correctly log the status here
        console.log("propertiesCount", propertiesCount);
        res.send({ limitReached: limitReached, subscriptionType: packageName });
    } catch (error) {
        console.error('Error checking property limit:', error);
        res.status(500).send('Error checking property limit');
    }
}));


module.exports = router;

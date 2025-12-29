const Subscription = require('../models/Subscription');

exports.addSubscription = async (req, res) => {
    try {
        const { email, packageName, subscriptionStatus } = req.body;
        const userId = req.user.id;
        const newSubscription = new Subscription({ email, packageName, subscriptionStatus, userId });
        await newSubscription.save();
        res.status(201).send({ message: 'Subscription added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to add subscription' });
    }
};

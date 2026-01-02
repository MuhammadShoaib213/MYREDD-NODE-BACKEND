const Schedule = require('../models/Schedule');
const Customer = require('../models/Customer');

// Add a new schedule
exports.addSchedule = async (req, res) => {
    const { propertyId, customerId, scheduleType, time, date } = req.body;
    const userId = req.user.id;
    try {
        const newSchedule = new Schedule({ userId, propertyId, customerId, scheduleType, time, date });
        await newSchedule.save();
        res.status(201).json({ message: "Schedule created successfully", schedule: newSchedule });
    } catch (error) {
        res.status(500).json({ message: "Failed to create schedule", error: error.message });
    }
};

// Get schedules by user ID
exports.getSchedulesByUser = async (req, res) => {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    try {
        const schedules = await Schedule.find({ userId }).populate('propertyId').populate('customerId');
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve schedules", error: error.message });
    }
};


exports.fetchSchedulesByUserId = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }
        const schedules = await Schedule.find({ userId: userId })
            .populate({
                path: 'customerId', // Assuming customerId is the reference in Schedule schema
                model: 'Customer', // Ensure this is the correct model name for customers
                select: 'fullName' // Only fetch the fullName field from Customer
            });

        // Check if we have schedules to avoid sending empty data
        if (schedules.length > 0) {
            // Map the results to enhance with readable data
            const enhancedSchedules = schedules.map(schedule => {
                return {
                    ...schedule.toObject(), // Convert mongoose document to object
                    customerName: schedule.customerId.fullName, // Directly access the full name of the customer
                    scheduleType: schedule.scheduleType // Include schedule type if it's part of the Schedule model
                };
            });

            res.status(200).json(enhancedSchedules);
        } else {
            res.status(404).json({ message: 'No schedules found for this user.' });
        }
    } catch (error) {
        console.error('Failed to fetch schedules:', error);
        res.status(500).json({ message: 'Error fetching schedules', error: error.message });
    }
};

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/verifyToken');

router.post('/add', authenticateToken, scheduleController.addSchedule);
router.get('/user/:userId', authenticateToken, scheduleController.getSchedulesByUser);
router.get('/user/all/:userId', authenticateToken, scheduleController.fetchSchedulesByUserId);

module.exports = router;

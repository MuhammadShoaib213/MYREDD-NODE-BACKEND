const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/add', authenticateToken, asyncHandler(scheduleController.addSchedule));
router.get('/user', authenticateToken, asyncHandler(scheduleController.getSchedulesByUser));
router.get('/user/all', authenticateToken, asyncHandler(scheduleController.fetchSchedulesByUserId));

module.exports = router;

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/add', scheduleController.addSchedule);
router.get('/user/:userId', scheduleController.getSchedulesByUser);
router.get('/user/all/:userId', scheduleController.fetchSchedulesByUserId);

module.exports = router;

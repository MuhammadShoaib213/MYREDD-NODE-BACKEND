const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { limiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// Route to handle form submission
router.post('/send', limiter, asyncHandler(contactController.sendEmail));

module.exports = router;

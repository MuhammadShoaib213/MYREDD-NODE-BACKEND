const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { limiter } = require('../middleware/rateLimiter');

// Route to handle form submission
router.post('/send', limiter, contactController.sendEmail);

module.exports = router;

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Route to handle form submission
router.post('/send', contactController.sendEmail);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken');
const sharedLeadController = require('../controllers/sharedLeadController');

// Define the route for sharing a lead
router.post('/share-lead', authenticateToken, sharedLeadController.shareLead);
router.get('/shared', authenticateToken, sharedLeadController.getSharedLeads);
router.get('/received', authenticateToken, sharedLeadController.getReceivedLeads);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { authenticateToken } = require('../middleware/verifyToken');
// const sharedLeadController = require('../controllers/sharedLeadController');

// // Define the route for sharing a lead
// router.post('/share-lead', authenticateToken, sharedLeadController.shareLead);
// router.get('/shared', authenticateToken, sharedLeadController.getSharedLeads);
// router.get('/received', authenticateToken, sharedLeadController.getReceivedLeads);

// module.exports = router;


const express            = require('express');
const { authenticateToken } = require('../middleware/verifyToken');
const c = require('../controllers/sharedLeadController');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post  ('/share-lead',                   authenticateToken, asyncHandler(c.shareLead));
router.get   ('/shared',                       authenticateToken, asyncHandler(c.getSharedLeads));
router.get   ('/broadcast/:id',                authenticateToken, asyncHandler(c.getBroadcastTracking));
router.get   ('/received',                     authenticateToken, asyncHandler(c.getReceivedLeads));
router.patch ('/received/:id/status',          authenticateToken, asyncHandler(c.updateReceivedStatus));

module.exports = router;

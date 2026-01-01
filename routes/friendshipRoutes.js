const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest } = require('../controllers/friendshipController');
const { authenticateToken } = require('../middleware/verifyToken'); // Assuming an authentication middleware
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/request', authenticateToken, asyncHandler(sendFriendRequest));
router.post('/accept', authenticateToken, asyncHandler(acceptFriendRequest));

// Additional routes for decline, block, list friends etc.

module.exports = router;

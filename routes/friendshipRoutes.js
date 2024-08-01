const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest } = require('../controllers/friendshipController');
const { authenticateToken } = require('../middleware/verifyToken'); // Assuming an authentication middleware

router.post('/request', authenticateToken, sendFriendRequest);
router.post('/accept', authenticateToken, acceptFriendRequest);

// Additional routes for decline, block, list friends etc.

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken'); // typical JWT auth
const {
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');
const { asyncHandler } = require('../middleware/errorHandler');

// GET user notifications
router.get('/', authenticateToken, asyncHandler(getNotifications));

// PATCH mark specific notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(markAsRead));

module.exports = router;

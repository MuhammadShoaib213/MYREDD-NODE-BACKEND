const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken'); // typical JWT auth
const {
  getNotifications,
  markAsRead,
  markAllRead
} = require('../controllers/notificationController');
const { asyncHandler } = require('../middleware/errorHandler');

// GET user notifications
router.get('/', authenticateToken, asyncHandler(getNotifications));

// PATCH mark specific notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(markAsRead));
// POST mark all notifications as read (used by mobile bell)
router.post('/read-all-sent', authenticateToken, asyncHandler(markAllRead));
// POST mark all notifications as read (generic)
router.post('/read-all', authenticateToken, asyncHandler(markAllRead));

module.exports = router;

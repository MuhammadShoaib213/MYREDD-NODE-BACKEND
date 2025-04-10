const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken'); // typical JWT auth
const {
  getNotifications,
  markAsRead
} = require('../controllers/notificationController');

// GET user notifications
router.get('/', authenticateToken, getNotifications);

// PATCH mark specific notification as read
router.patch('/:id/read', authenticateToken, markAsRead);

module.exports = router;

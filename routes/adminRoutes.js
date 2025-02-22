// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.get('/dashboard', adminAuth, adminController.getDashboardData);

// Development route - remove in production
router.post('/create-initial-admin', adminController.createInitialAdmin);

module.exports = router;
// backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { asyncHandler } = require('../middleware/errorHandler');

// Signup Route
router.post('/api/auth/signup', asyncHandler(userController.signup));

module.exports = router;

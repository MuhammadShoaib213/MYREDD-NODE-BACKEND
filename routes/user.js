// backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Signup Route
router.post('/api/auth/signup', userController.signup);

module.exports = router;

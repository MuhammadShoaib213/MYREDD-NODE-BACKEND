// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/verifyToken');
const upload = require('../middleware/upload');
const { limiter } = require('../middleware/rateLimiter');

// Route for user signup
router.post('/signup',  limiter, authController.signup);

// Route for user login with rate limiting
router.post('/login',  limiter, authController.login);

// Assuming authenticateUser is a middleware that validates the token and sets req.user
router.get('/agents/:agencyId', authenticateToken, authController.getAllAgents);

router.put('/agents/:id', authenticateToken, authController.updateAgent);

router.delete('/agents/:id', authenticateToken, authController.deleteAgent);


router.post('/send-otp',  limiter, authController.sendOtp);
router.post('/verify-otp',  limiter, authController.verifyOtp);


router.get('/profile/:id', authenticateToken, authController.getProfile);

// Route for updating user profile
router.patch('/profile/:id', authenticateToken, upload, authController.updateProfile);


router.get('/search', authenticateToken, authController.searchUsers);


// Route to initiate password reset process
router.post('/forgot-password',  limiter, authController.forgotPassword);

// Route to verify OTP
router.post('/verify-otp-pass', limiter, authController.verifyOtpPass);

// Route for resetting password
router.post('/reset-password',  limiter, authController.resetPassword);

router.post('/invite',  limiter, authController.invite);

router.post('/invite-sms',  limiter, authenticateToken, authController.inviteBySMS);


module.exports = router;

// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

// Define rate limiting rule
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 5 login attempts per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Route for user signup
router.post('/signup', authController.signup);

// Route for user login with rate limiting
router.post('/login', loginLimiter, authController.login);

// Assuming authenticateUser is a middleware that validates the token and sets req.user
router.get('/agents/:agencyId', authenticateToken, authController.getAllAgents);

router.put('/agents/:id', authenticateToken, authController.updateAgent);

router.delete('/agents/:id', authenticateToken, authController.deleteAgent);


router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);


router.get('/profile/:id', authenticateToken, authController.getProfile);

// Route for updating user profile
router.patch('/profile/:id', authenticateToken, upload, authController.updateProfile);


router.get('/search', authenticateToken, authController.searchUsers);


// Route to initiate password reset process
router.post('/forgot-password', authController.forgotPassword);

// Route to verify OTP
router.post('/verify-otp-pass', authController.verifyOtpPass);

// Route for resetting password
router.post('/reset-password', authController.resetPassword);




module.exports = router;

// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
  message: 'Too many requests, please try again later.',
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: { error: 'Too many OTP attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
exports.otpLimiter = otpLimiter;

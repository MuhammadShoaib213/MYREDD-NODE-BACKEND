// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
  message: 'Too many requests, please try again later.',
});

// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { asyncHandler } = require('../middleware/errorHandler');

// Import rate limiter middleware (optional per route)
const { limiter } = require('../middleware/rateLimiter');

// Reverse Geocoding Route
router.get('/reverse-geocode', asyncHandler(addressController.reverseGeocode));

// Autocomplete Route with rate limiting
router.get('/autocomplete', limiter, asyncHandler(addressController.autocomplete));

// Place Details Route
router.get('/place-details', asyncHandler(addressController.placeDetails));

module.exports = router;

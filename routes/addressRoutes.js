// routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Import rate limiter middleware (optional per route)
const { limiter } = require('../middleware/rateLimiter');

// Reverse Geocoding Route
router.get('/reverse-geocode', addressController.reverseGeocode);

// Autocomplete Route with rate limiting
router.get('/autocomplete', limiter, addressController.autocomplete);

// Place Details Route
router.get('/place-details', addressController.placeDetails);

module.exports = router;

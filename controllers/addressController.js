// controllers/addressController.js
const axios = require('axios');
const cache = require('../utils/cache');

// Reverse Geocoding Controller
exports.reverseGeocode = async (req, res, next) => {
  const { lat, lng } = req.query;
  const cacheKey = `reverse-geocode-${lat}-${lng}`;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing lat or lng parameters' });
  }

  // Check cache
  const cachedAddress = cache.get(cacheKey);
  if (cachedAddress) {
    return res.json({ address: cachedAddress });
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const data = response.data;

    if (data.status !== 'OK') {
      return res
        .status(500)
        .json({ error: data.error_message || 'Error fetching address' });
    }

    const address = data.results[0]?.formatted_address;

    // Cache the result
    cache.set(cacheKey, address);

    res.json({ address });
  } catch (error) {
    console.error('Error fetching address:', error);
    next(error);
  }
};

// Autocomplete Controller
exports.autocomplete = async (req, res, next) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ error: 'Missing input parameter' });
  }

  const cacheKey = `autocomplete-${input}`;
  const cachedSuggestions = cache.get(cacheKey);
  if (cachedSuggestions) {
    return res.json(cachedSuggestions);
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input,
          key: process.env.GOOGLE_API_KEY,
          sessiontoken: req.sessionID,
        },
      }
    );

    const data = response.data;

    if (data.status !== 'OK') {
      return res
        .status(500)
        .json({ error: data.error_message || 'Error fetching suggestions' });
    }

    // Cache the result
    cache.set(cacheKey, data.predictions);

    res.json(data.predictions);
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    next(error);
  }
};

// Place Details Controller
exports.placeDetails = async (req, res, next) => {
  const { place_id } = req.query;

  if (!place_id) {
    return res.status(400).json({ error: 'Missing place_id parameter' });
  }

  const cacheKey = `place-details-${place_id}`;
  const cachedDetails = cache.get(cacheKey);
  if (cachedDetails) {
    return res.json(cachedDetails);
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id,
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const data = response.data;

    if (data.status !== 'OK') {
      return res
        .status(500)
        .json({ error: data.error_message || 'Error fetching place details' });
    }

    // Cache the result
    cache.set(cacheKey, data.result);

    res.json(data.result);
  } catch (error) {
    console.error('Error fetching place details:', error);
    next(error);
  }
};

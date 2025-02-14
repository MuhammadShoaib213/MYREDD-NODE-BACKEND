// routes/places.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /api/places/cities
 * Returns the list of all city names from cities.json
 */
router.get('/cities', (req, res) => {
  try {
    // Read the file that has the "cities" array
    const citiesPath = path.join(__dirname, '..', 'data', 'cities.json');
    const data = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
    // data looks like: { "cities": ["Islamabad", "Karachi", "Lahore", ...] }

    res.json(data.cities); // Return just the array of city names
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not read cities data.' });
  }
});

/**
 * GET /api/places/cities/:cityName/areas
 * Reads a JSON file named after the city (e.g. "Karachi.json") and returns its contents
 */
// GET /api/places/cities/:cityName/areas
router.get('/cities/:cityName/areas', (req, res) => {
  const { cityName } = req.params;
  const filePath = path.join(__dirname, '..', 'data', `${cityName}.json`);

  try {
    // 1) Check if file exists
    if (!fs.existsSync(filePath)) {
      // If the file doesn't exist, just return an empty array
      return res.json([]);
    }

    // 2) Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 3) If the file is empty or just whitespace, return an empty array
    if (!fileContent.trim()) {
      return res.json([]);
    }

    // 4) Otherwise, parse the JSON content
    const data = JSON.parse(fileContent);

    // 5) Return the parsed data
    res.json(data);

  } catch (error) {
    console.error('Error reading/parsing JSON file:', error);
    // Optionally handle parsing error or other issues
    // For instance, return an empty array or a specific error message
    return res.json([]);
  }
});

module.exports = router;
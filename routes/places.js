// const express = require('express');
// const axios = require('axios');
// const router = express.Router();

// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
// const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
// const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

// /* 
//   1) City Autocomplete
//      GET /api/places/autocomplete/:input
// */
// router.get('/autocomplete/:input', async (req, res) => {
//   const { input } = req.params;
//   // Only cities
//   const url = `${AUTOCOMPLETE_URL}?input=${encodeURIComponent(input)}&types=(cities)&key=${GOOGLE_API_KEY}`;

//   try {
//     const response = await axios.get(url);
//     // Return all predictions (includes place_id, description, etc.)
//     res.json(response.data.predictions);
//   } catch (error) {
//     console.error('Error fetching autocomplete:', error);
//     res.status(500).json({ message: 'Failed to fetch autocomplete results' });
//   }
// });

// /*
//   2) City Details
//      GET /api/places/details/:placeId
//      - Use for lat/lng if needed (optional)
// */
// router.get('/details/:placeId', async (req, res) => {
//   const { placeId } = req.params;
//   const url = `${DETAILS_URL}?place_id=${placeId}&key=${GOOGLE_API_KEY}`;

//   try {
//     const response = await axios.get(url);
//     // Return the entire "result" object (includes geometry)
//     res.json(response.data.result);
//   } catch (error) {
//     console.error('Error fetching place details:', error);
//     res.status(500).json({ message: 'Failed to fetch place details' });
//   }
// });

// /*
//   3) Municipalities (Level 1)
//      GET /api/places/municipalities?city=Lahore
//      - By default, do "towns in Lahore"
//      - Up to ~60 results w/ next_page_token
// */
// router.get('/municipalities', async (req, res) => {
//   const { city, query } = req.query;
//   // Example: "towns in Lahore" or "societies in Lahore"
//   const searchQuery = `${query || 'towns'} in ${city}`;
  
//   let allResults = [];
//   let nextPageToken = null;

//   async function fetchPage(token) {
//     let url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;
//     if (token) {
//       url += `&pagetoken=${token}`;
//     }
//     return axios.get(url);
//   }

//   try {
//     do {
//       if (nextPageToken) {
//         // wait ~2s between pages
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//       const response = await fetchPage(nextPageToken);
//       const data = response.data;
//       allResults.push(...data.results);

//       nextPageToken = data.next_page_token || null;
//     } while (nextPageToken);

//     res.json(allResults);
//   } catch (error) {
//     console.error('Error fetching municipalities:', error);
//     res.status(500).json({ message: 'Failed to fetch municipality areas' });
//   }
// });

// /*
//   4) Sub-Municipalities (Level 2)
//      GET /api/places/submunicipalities?parent=Johar Town Lahore
//      - Example query: "blocks in Johar Town Lahore"
// */
// router.get('/submunicipalities', async (req, res) => {
//   const { parent, query } = req.query;
//   // e.g. "blocks in Johar Town Lahore"
//   const searchQuery = `${query || 'blocks'} in ${parent}`;

//   let allResults = [];
//   let nextPageToken = null;

//   async function fetchPage(token) {
//     let url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;
//     if (token) {
//       url += `&pagetoken=${token}`;
//     }
//     return axios.get(url);
//   }

//   try {
//     do {
//       if (nextPageToken) {
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//       const response = await fetchPage(nextPageToken);
//       const data = response.data;
//       allResults.push(...data.results);

//       nextPageToken = data.next_page_token || null;
//     } while (nextPageToken);

//     res.json(allResults);
//   } catch (error) {
//     console.error('Error fetching sub-municipalities:', error);
//     res.status(500).json({ message: 'Failed to fetch submunicipalities' });
//   }
// });

// /*
//   5) Drilldown (Level 3)
//      GET /api/places/drilldown?parent=Block A Johar Town Lahore
//      - Example query: "streets in Block A Johar Town Lahore"
// */
// router.get('/drilldown', async (req, res) => {
//   const { parent, query } = req.query;
//   // e.g. "streets in Block A Johar Town Lahore"
//   const searchQuery = `${query || 'streets'} in ${parent}`;

//   let allResults = [];
//   let nextPageToken = null;

//   async function fetchPage(token) {
//     let url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`;
//     if (token) {
//       url += `&pagetoken=${token}`;
//     }
//     return axios.get(url);
//   }

//   try {
//     do {
//       if (nextPageToken) {
//         // Wait ~2s between pages
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//       const response = await fetchPage(nextPageToken);
//       const data = response.data;
//       allResults.push(...data.results);

//       nextPageToken = data.next_page_token || null;
//     } while (nextPageToken);

//     res.json(allResults);
//   } catch (error) {
//     console.error('Error fetching deeper level (drilldown):', error);
//     res.status(500).json({ message: 'Failed to fetch deeper level' });
//   }
// });

// module.exports = router;

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
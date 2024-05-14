// const express = require('express');
// const multer = require('multer');
// const PropertyController = require('../controllers/propertyController'); // Ensure this path is correct

// // Configure storage for file uploads
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, './uploads/'); // Make sure this directory exists
//   },
//   filename: function(req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`); // Use Date.now() to prevent filename conflicts
//   }
// });

// // Initialize multer with the storage configuration
// const upload = multer({ storage });

// const router = express.Router();

// // Route to add a new property with image and video uploads
// router.post('/add', upload.fields([
//   { name: 'images', maxCount: 20 },  // Adjust maxCount as needed
//   { name: 'video', maxCount: 1 }
// ]), PropertyController.addProperty);



const express = require('express');
const multer = require('multer');
const PropertyController = require('../controllers/PropertyController');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

router.post('/add', upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'video', maxCount: 1 }
]), PropertyController.addProperty);


// New route for fetching all properties
router.get('/all', PropertyController.fetchAllProperties);

module.exports = router;


module.exports = router;
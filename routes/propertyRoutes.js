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
const PropertyController = require('../controllers/propertyController');

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
router.get('/property/:id', PropertyController.fetchPropertyById);
router.get('/propertybyid/:id', PropertyController.fetchPropertyByyId);
router.get('/propertyAd/:id', PropertyController.fetchPropertyAd);
router.get('/user/:userId', PropertyController.fetchUserPropertiesWithInquiryType);
router.get('/lead/user/:userId', PropertyController.fetchleads);
router.patch('/updateStatus/:id', PropertyController.updatePropertyStatus);
router.get('/findMatches/:propertyId', PropertyController.findMatches);
router.put('/:id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]), PropertyController.updateProperty);

module.exports = router;


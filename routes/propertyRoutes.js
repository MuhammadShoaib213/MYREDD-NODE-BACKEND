const express = require('express');
const multer = require('multer');
const PropertyController = require('../controllers/propertyController');
const addPropertyUpload = require('../middleware/addPropertyMulter'); // Import custom Multer config

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Default upload directory for other routes
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.post('/add', addPropertyUpload, PropertyController.addProperty);

// Default routes with existing Multer configuration
router.get('/all', PropertyController.fetchAllProperties);
router.get('/property/:id', PropertyController.fetchPropertyById);
router.get('/propertybyid/:id', PropertyController.fetchPropertyByyId);
router.get('/propertyAd/:id', PropertyController.fetchPropertyAd);
router.get('/user/:userId', PropertyController.fetchUserPropertiesWithInquiryType);
router.get('/lead/user/:userId', PropertyController.fetchleads);
router.patch('/updateStatus/:id', PropertyController.updatePropertyStatus);
router.post('/searchProperties', PropertyController.searchProperties);

// Update property route with the default Multer configuration
router.put(
  '/:id',
  upload.fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]),
  PropertyController.updateProperty
);

module.exports = router;

// routes/propertyRoutes.js - CORRECTED VERSION
const express = require('express');
const multer = require('multer');
const PropertyController = require('../controllers/propertyController');
const addPropertyUpload = require('../middleware/addPropertyMulter');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const dir = './uploads/';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const path = require('path');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-_]/g, '_')
      .substring(0, 50);
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const router = express.Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

// Add new property
router.post(
  '/add',
  authenticateToken,
  addPropertyUpload,
  asyncHandler(PropertyController.addProperty)
);

// Get all properties for authenticated user
router.get(
  '/all',
  authenticateToken,
  asyncHandler(PropertyController.fetchAllProperties)
);

// Get single property by ID
router.get(
  '/property/:id',
  authenticateToken,
  asyncHandler(PropertyController.fetchPropertyById)
);

// Alternative property by ID route
router.get(
  '/propertybyid/:id',
  authenticateToken,
  asyncHandler(PropertyController.fetchPropertyByyId)
);

// Get property ad (public view)
router.get(
  '/propertyAd/:id',
  authenticateToken,
  asyncHandler(PropertyController.fetchPropertyAd)
);

// Get user properties with inquiry type
router.get(
  '/user/:userId',
  authenticateToken,
  asyncHandler(PropertyController.fetchUserPropertiesWithInquiryType)
);

// Get leads for user
router.get(
  '/lead/user/:userId',
  authenticateToken,
  asyncHandler(PropertyController.fetchleads)
);

// Update property status
router.patch(
  '/updateStatus/:id',
  authenticateToken,
  asyncHandler(PropertyController.updatePropertyStatus)
);

// Search properties
router.post(
  '/searchProperties',
  authenticateToken,
  asyncHandler(PropertyController.searchProperties)
);

// Update property
router.put(
  '/:id',
  authenticateToken,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ]),
  asyncHandler(PropertyController.updateProperty)
);

// Delete property (if you have this endpoint)
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(PropertyController.deleteProperty)
);

module.exports = router;

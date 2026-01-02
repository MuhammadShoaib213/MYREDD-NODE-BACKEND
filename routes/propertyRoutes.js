// routes/propertyRoutes.js - CORRECTED VERSION
const express = require('express');
const PropertyController = require('../controllers/propertyController');
const addPropertyUpload = require('../middleware/addPropertyMulter');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

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
  '/user',
  authenticateToken,
  asyncHandler(PropertyController.fetchUserPropertiesWithInquiryType)
);
// Backward-compatible alias (userId is ignored; JWT user is enforced)
router.get(
  '/user/:userId',
  authenticateToken,
  asyncHandler(PropertyController.fetchUserPropertiesWithInquiryType)
);

// Get leads for user
router.get(
  '/lead/user',
  authenticateToken,
  asyncHandler(PropertyController.fetchleads)
);
// Backward-compatible alias (userId is ignored; JWT user is enforced)
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
  addPropertyUpload,
  asyncHandler(PropertyController.updateProperty)
);

// Delete property (if you have this endpoint)
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(PropertyController.deleteProperty)
);

module.exports = router;

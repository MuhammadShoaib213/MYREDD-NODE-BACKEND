// routes/customers.js - CORRECTED VERSION
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

// Get all customers for authenticated user
router.get(
  '/',
  authenticateToken,
  asyncHandler(customerController.getCustomers)
);

// Add new customer
router.post(
  '/add',
  authenticateToken,
  customerController.upload.single('image'),
  asyncHandler(customerController.addCustomer)
);

// Check if customer exists
router.get(
  '/check',
  authenticateToken,
  asyncHandler(customerController.checkCustomer)
);

// Get single customer detail
router.get(
  '/detail/:id',
  authenticateToken,
  asyncHandler(customerController.getCustomerDetail)
);

// Update customer (if exists)
router.put(
  '/:id',
  authenticateToken,
  customerController.upload.single('image'),
  asyncHandler(customerController.updateCustomer)
);

// Delete customer (if exists)
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(customerController.deleteCustomer)
);

module.exports = router;

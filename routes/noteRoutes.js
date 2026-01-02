// routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authenticateToken } = require('../middleware/verifyToken');
const upload = require('../middleware/upload'); // Ensure this path matches where your upload middleware is defined
const { asyncHandler } = require('../middleware/errorHandler');

// Use the upload middleware to handle the files
router.post('/notes', authenticateToken, upload, asyncHandler(noteController.createNote));
router.get('/notes/:propertyId/:customerId', authenticateToken, asyncHandler(noteController.getNotesByUserPropertyCustomer));
router.delete('/notes/:id', authenticateToken, asyncHandler(noteController.deleteNote));


module.exports = router;

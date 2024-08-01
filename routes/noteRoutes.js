// routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authenticateToken } = require('../middleware/verifyToken');
const upload = require('../middleware/upload'); // Ensure this path matches where your upload middleware is defined

// Use the upload middleware to handle the files
router.post('/notes', authenticateToken, upload, noteController.createNote);
router.get('/notes/:userId/:propertyId/:customerId', authenticateToken, noteController.getNotesByUserPropertyCustomer);
router.delete('/notes/:id', authenticateToken, noteController.deleteNote);


module.exports = router;

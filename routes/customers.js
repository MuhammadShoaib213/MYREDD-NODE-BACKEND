const express = require('express');
const router = express.Router();
const multer = require('multer');
const Customer = require('../models/customer');

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image')) {
    cb(null, true); 
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// router.get('/', async (req, res) => {
//     try {
//       const customers = await Customer.find({});
//       res.json(customers);
//     } catch (error) {
//       console.error('Failed to retrieve customers:', error);
//       res.status(500).json({ message: 'Failed to retrieve customers' });
//     }
//   });

// Assuming 'Customer' is your Mongoose model for the customers collection

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;  // Get user ID from query parameters
    const customers = await Customer.find({ userId: userId });  // Query to find customers by user ID
    res.json(customers);
  } catch (error) {
    console.error('Failed to retrieve customers:', error);
    res.status(500).json({ message: 'Failed to retrieve customers' });
  }
});


  router.post('/add', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    
    const newCustomer = new Customer({
      ...req.body,
      profilePicture: req.file.path
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'Failed to add customer', error: error.message });
  }
});

router.get('/check', async (req, res) => {
  try {
    const { cnicNumber } = req.query; // Adjusted to accept only CNIC number
    console.log('Received request to check customer with CNIC:', cnicNumber);

    // Ensure CNIC number is provided and follows the expected format
    if (!/^\d{16}$/.test(cnicNumber)) {
      console.log('Invalid CNIC format received:', cnicNumber);
      return res.status(400).json({ message: "Invalid CNIC format. CNIC must be a 16-digit number." });
    }

    console.log('Querying database for customer by CNIC...');
    const customer = await Customer.findOne({ cnicNumber });

    console.log('Database query completed.');
    if (customer) {
      console.log('Customer found with CNIC:', cnicNumber);
      res.json({ exists: true, customer });
    } else {
      console.log('Customer not found with CNIC:', cnicNumber);
      res.status(404).json({ exists: false, message: "Customer not found" });
    }
  } catch (error) {
    console.error('Error during customer check:', error);
    res.status(500).send(error.message);
  }
});

module.exports = router;

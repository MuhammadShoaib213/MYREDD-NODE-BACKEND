
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getCustomers);
router.post('/add', customerController.upload.single('image'), customerController.addCustomer);
router.get('/check', customerController.checkCustomer);
router.get('/detail/:id', customerController.getCustomerDetail);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const Customer = require('../models/Customer');

// // Set up multer for file storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   // Accept images only
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true); 
//   } else {
//     cb(new Error('Not an image! Please upload only images.'), false);
//   }
// };

// const upload = multer({ storage: storage, fileFilter: fileFilter });



// router.get('/', async (req, res) => {
//   try {
//     const userId = req.query.userId;  // Get user ID from query parameters
//     const customers = await Customer.find({ userId: userId });  // Query to find customers by user ID
//     res.json(customers);
//     console.log(customers);
//   } catch (error) {
//     console.error('Failed to retrieve customers:', error);
//     res.status(500).json({ message: 'Failed to retrieve customers' });
//   }
// });


// //   router.post('/add', upload.single('image'), async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       throw new Error('No file uploaded');
// //     }
    
// //     const newCustomer = new Customer({
// //       ...req.body,
// //       profilePicture: req.file.path
// //     });

// //     await newCustomer.save();
// //     res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
// //   } catch (error) {
// //     console.error('Error adding customer:', error);
// //     res.status(500).json({ message: 'Failed to add customer', error: error.message });
// //   }
// // });
// router.post('/add', upload.single('image'), async (req, res) => {
//   try {
//     console.log('Request received to add customer:', req.body);

//     if (!req.file) {
//       console.error('Error: No file uploaded');
//       throw new Error('No file uploaded');
//     }

//     console.log('File uploaded successfully:', req.file);

//     const newCustomer = new Customer({
//       ...req.body,
//       profilePicture: req.file.path
//     });

//     console.log('New customer object created:', newCustomer);

//     await newCustomer.save();
//     console.log('Customer saved successfully to the database');

//     res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
//   } catch (error) {
//     console.error('Error adding customer:', {
//       message: error.message,
//       stack: error.stack,
//       requestData: req.body,
//       fileData: req.file,
//     });

//     res.status(500).json({ message: 'Failed to add customer', error: error.message });
//     console.log(error);
//   }
// });


// // // router.get('/check', async (req, res) => {
// // //   try {
// // //     const { cnicNumber } = req.query; // Adjusted to accept only CNIC number
// // //     console.log('Received request to check customer with CNIC:', cnicNumber);

// // //     // Ensure CNIC number is provided and follows the expected format
// // //     if (!/^\d{16}$/.test(cnicNumber)) {
// // //       console.log('Invalid CNIC format received:', cnicNumber);
// // //       return res.status(400).json({ message: "Invalid CNIC format. CNIC must be a 16-digit number." });
// // //     }

// // //     console.log('Querying database for customer by CNIC...');
// // //     const customer = await Customer.findOne({ cnicNumber });

// // //     console.log('Database query completed.');
// // //     if (customer) {
// // //       console.log('Customer found with CNIC:', cnicNumber);
// // //       res.json({ exists: true, customer });
// // //     } else {
// // //       console.log('Customer not found with CNIC:', cnicNumber);
// // //       res.status(404).json({ exists: false, message: "Customer not found" });
// // //     }
// // //   } catch (error) {
// // //     console.error('Error during customer check:', error);
// // //     res.status(500).send(error.message);
// // //   }
// // // });


// // router.get('/check', async (req, res) => {
// //   const { cnicNumber, phoneNumber } = req.query;
// //   console.log('Received request to check customer:', { CNIC: cnicNumber, Phone: phoneNumber });

// //   // Validate that at least one input is provided
// //   if (!cnicNumber && !phoneNumber) {
// //     console.log('Validation error: No identifiers provided');
// //     return res.status(400).json({ message: "Please provide either a CNIC number or a phone number." });
// //   }

// //   // Validate CNIC format
// //   if (cnicNumber && !/^\d{16}$/.test(cnicNumber)) {
// //     console.log('Validation error: Incorrect CNIC format', cnicNumber);
// //     return res.status(400).json({ message: "Invalid CNIC format. CNIC must be a 16-digit number." });
// //   }

// //   // Validate phone number format
// //   if (phoneNumber && !/^\+?\d{10,}$/.test(phoneNumber)) {
// //     console.log('Validation error: Incorrect phone number format', phoneNumber);
// //     return res.status(400).json({ message: "Invalid phone number format." });
// //   }

// //   // Constructing a query based on the provided input
// //   let query = {};
// //   if (cnicNumber) {
// //     query.cnicNumber = cnicNumber;
// //     console.log('Querying database for CNIC:', cnicNumber);
// //   }
// //   if (phoneNumber) {
// //     query.$or = [
// //       { officialMobile: phoneNumber },
// //       { personalMobile: phoneNumber },
// //       { whatsappMobile: phoneNumber }
// //     ];
// //     console.log('Querying database for phone number:', phoneNumber);
// //   }

// //   // Execute the database query
// //   try {
// //     const customer = await Customer.findOne(query);
// //     if (customer) {
// //       console.log('Customer found:', customer);
// //       res.json({ exists: true, customer });
// //     } else {
// //       console.log('Customer not found with provided identifiers:', query);
// //       res.status(404).json({ exists: false, message: "Customer not found" });
// //     }
// //   } catch (error) {
// //     console.error('Database query error during customer check:', error);
// //     res.status(500).send(error.message);
// //   }
// // });

// router.get('/check', async (req, res) => {
//   const { cnicNumber, phoneNumber } = req.query;
//   console.log('Received request to check customer:', { CNIC: cnicNumber, Phone: phoneNumber });

//   // Validate that at least one input is provided
//   if (!cnicNumber && !phoneNumber) {
//     console.log('Validation error: No identifiers provided');
//     return res.status(400).json({ message: "Please provide either a CNIC number or a phone number." });
//   }

//   // Validate CNIC format
//   // if (cnicNumber && !/^\d{16}$/.test(cnicNumber)) {
//   //   console.log('Validation error: Incorrect CNIC format', cnicNumber);
//   //   return res.status(400).json({ message: "Invalid CNIC format. CNIC must be a 16-digit number." });
//   // }

//   // Validate phone number format
//   if (phoneNumber && !/^\+?\d{10,}$/.test(phoneNumber)) {
//     console.log('Validation error: Incorrect phone number format', phoneNumber);
//     return res.status(400).json({ message: "Invalid phone number format." });
//   }

//   // Constructing a query based on the provided input
//   let query = {};
//   if (cnicNumber) {
//     query.cnicNumber = cnicNumber;
//     console.log('Querying database for CNIC:', cnicNumber);
//   }
//   if (phoneNumber) {
//     query.$or = [
//       { officialMobile: phoneNumber },
//       { personalMobile: phoneNumber },
//       { whatsappMobile: phoneNumber }
//     ];
//     console.log('Querying database for phone number:', phoneNumber);
//   }

//   // Execute the database query
//   try {
//     const customer = await Customer.findOne(query);
//     if (customer) {
//       console.log('Customer found:', customer);
//       res.json({ exists: true, customer });
//     } else {
//       console.log('Customer not found with provided identifiers:', query);
//       res.status(404).json({ exists: false, message: "Customer not found" });
//     }
//   } catch (error) {
//     console.error('Database query error during customer check:', error);
//     res.status(500).send(error.message);
//   }
// });


// // Fetch a single customer detail by ID
// router.get('/detail/:id', async (req, res) => {
//   try {
//     const customer = await Customer.findById(req.params.id);
//     if (!customer) {
//       return res.status(404).json({ message: 'Customer not found' });
//     }
//     res.json(customer);
//   } catch (error) {
//     console.error('Failed to retrieve customer:', error);
//     res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// });



// module.exports = router;

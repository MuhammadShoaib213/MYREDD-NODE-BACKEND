const Customer = require('../models/Customer');
const multer = require('multer');
const InviteToken = require('../models/InviteToken');

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
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Controller to handle fetching customers
exports.getCustomers = async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log(`Fetching customers for user ID: ${userId}`);
    const customers = await Customer.find({ userId: userId });
    console.log(`Customers retrieved: ${customers.length} found`);
    res.json(customers);
  } catch (error) {
    console.error('Failed to retrieve customers:', error);
    res.status(500).json({ message: `Failed to retrieve customers due to server error: ${error.message}` });
  }
};

exports.addCustomer = async (req, res) => {
  console.log('Received request:', req.body);
  console.log('File details:', req.file);

  const { userId, cnicNumber, inviteToken } = req.body;
  let actualUserId = userId;

  try {
    // If userId is not provided and inviteToken is provided, find the inviter's userId
    if (!userId && inviteToken) {
      const invite = await InviteToken.findOne({ token: inviteToken });
      if (invite) {
        actualUserId = invite.inviter.toString(); // Assign inviter's userId
      } else {
        return res.status(400).json({ message: 'Invalid invite token' });
      }
    }

    if (!actualUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if this user has already added this CNIC
    const existingCustomer = await Customer.findOne({ userId: actualUserId, cnicNumber });
    if (existingCustomer) {
      return res.status(400).json({
        message: 'You have already added a customer with this CNIC.'
      });
    }

    if (!req.file) {
      console.error('No file uploaded error');
      throw new Error('No file uploaded');
    }

    console.log(`File uploaded at path: ${req.file.path}`);

    // Create the new customer object
    const newCustomer = new Customer({
      ...req.body,
      userId: actualUserId, // Assign the actual user ID (either from token or invite)
      profilePicture: req.file.path
    });

    // Find the customer with the highest customerId
    const lastCustomer = await Customer.findOne().sort({ customerId: -1 }).exec();
    console.log('Last customer:', lastCustomer);

    let newCustomerId = '0001'; // Default starting customerId
    if (lastCustomer && lastCustomer.customerId) {
      // Extract numeric part of customerId
      const customerIdStr = lastCustomer.customerId.match(/\d+/g)?.join('');
      console.log('Extracted numeric customerId:', customerIdStr);

      if (customerIdStr) {
        const lastIdNumber = parseInt(customerIdStr, 10);
        if (!isNaN(lastIdNumber)) {
          const nextIdNumber = lastIdNumber + 1;
          newCustomerId = nextIdNumber.toString().padStart(4, '0');
        } else {
          console.warn('Parsed lastIdNumber is NaN, defaulting newCustomerId to "0001"');
          newCustomerId = '0001';
        }
      } else {
        console.warn('Could not extract numeric customerId, defaulting to "0001"');
        newCustomerId = '0001';
      }
    } else {
      console.log('No previous customer found, starting customerId at "0001"');
    }

    // Assign the new customerId to the newCustomer object
    newCustomer.customerId = newCustomerId;

    // Save the new customer
    await newCustomer.save();
    console.log('Customer saved successfully:', newCustomer);

    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (error) {
    console.error('Error adding customer:', error);
    if (error.code === 11000) {
      // This error is thrown if the unique index constraint is violated
      res.status(400).json({ message: 'This customer has already been added by you.' });
    } else {
      res.status(500).json({ message: `Failed to add customer due to server error: ${error.message}` });
    }
  }
};


// Controller to check customer details
exports.checkCustomer = async (req, res) => {
  const { cnicNumber, phoneNumber } = req.query;
  console.log(`Checking customer with CNIC: ${cnicNumber} and Phone: ${phoneNumber}`);
  let query = {};
  if (cnicNumber) {
    query.cnicNumber = cnicNumber;
  }
  if (phoneNumber) {
    query.$or = [
      { officialMobile: phoneNumber },
      { personalMobile: phoneNumber },
      { whatsappMobile: phoneNumber }
    ];
  }
  try {
    const customer = await Customer.findOne(query);
    if (customer) {
      console.log('Customer found:', customer);
      res.json({ exists: true, customer });
    } else {
      console.log('Customer not found with provided identifiers:', query);
      res.status(404).json({ exists: false, message: "Customer not found with the provided identifiers." });
    }
  } catch (error) {
    console.error('Database query error during customer check:', error);
    res.status(500).send({ message: `Error during customer check: ${error.message}` });
  }
};

// Controller to fetch a single customer detail by ID
exports.getCustomerDetail = async (req, res) => {
  try {
    console.log(`Fetching customer detail for ID: ${req.params.id}`);
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      console.log('Customer not found:', req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }
    console.log('Customer retrieved:', customer);
    res.json(customer);
  } catch (error) {
    console.error('Failed to retrieve customer:', error);
    res.status(500).json({ message: `Internal server error while retrieving customer: ${error.message}` });
  }
};

exports.upload = upload;
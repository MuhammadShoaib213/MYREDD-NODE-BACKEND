// const Customer = require('../models/Customer');

// // Assuming you have a function for creating a customer
// const createCustomer = async (req, res) => {
//     // Create a customer object using the request body
//     // Include profilePicture if the file was uploaded
//     const customerData = {
//         cnicNumber: req.body.cnicNumber,
//         country: req.body.country,
//         cityFrom: req.body.cityFrom,
//         currentCity: req.body.currentCity,
//         fullName: req.body.fullName,
//         gender: req.body.gender,
//         profession: req.body.profession,
//         age: req.body.age,
//         mobileNumber: req.body.mobileNumber,
//         officialMobileNumber: req.body.officialMobileNumber,
//         whatsappNumber: req.body.whatsappNumber,
//         personalEmail: req.body.personalEmail,
//         officialEmail: req.body.officialEmail,
//         maritalStatus: req.body.maritalStatus,
//         currentAddress: req.body.currentAddress,
//         preferredContact: req.body.preferredContact,
//         profilePicture: req.file ? req.file.path : null // Set the path if file is uploaded
//     };

//     try {
//         // Create a new customer instance and save it to the database
//         const newCustomer = new Customer(customerData);
//         await newCustomer.save();

//         // Respond with the new customer data, HTTP status code 201 Created
//         res.status(201).json(newCustomer);
//     } catch (error) {
//         // If there's an error, respond with the error message, HTTP status code 400 Bad Request
//         res.status(400).json({ message: error.message });
//     }
// };



// module.exports = createCustomer;


const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');

const createCustomer = async (req, res) => {
  await Promise.all([
    body('userId').isMongoId().withMessage('Invalid user ID').run(req),
    body('country').notEmpty().withMessage('Country is required').run(req),
    body('cnicNumber').isNumeric().isLength({ min: 16, max: 16 }).withMessage('CNIC must be a 16-digit number').run(req),
    body('cityFrom').notEmpty().withMessage('City of origin is required').run(req),
    body('currentCity').notEmpty().withMessage('Current city is required').run(req),
    body('fullName').isString().withMessage('Full name must be a string').run(req),
    body('gender').isString().withMessage('Gender is required').run(req),
    body('age').optional().isNumeric().withMessage('Age must be a number').run(req),
    body('officialMobile').optional().isString().withMessage('Official mobile must be a string').run(req),
    body('personalMobile').optional().isString().withMessage('Personal mobile must be a string').run(req),
    body('whatsappMobile').optional().isString().withMessage('WhatsApp mobile must be a string').run(req),
    body('officialEmail').optional().isEmail().withMessage('Official email must be a valid email address').run(req),
    body('personalEmail').optional().isEmail().withMessage('Personal email must be a valid email address').run(req),
    body('maritalStatus').optional().isString().withMessage('Marital status must be a string').run(req),
    body('dependants').optional().isNumeric().withMessage('Dependants must be a number').run(req),
    body('currentAddress').optional().isString().withMessage('Current address must be a string').run(req),
    body('contactPreference').optional().isString().withMessage('Contact preference must be a string').run(req)
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customerData = {
    userId: req.body.userId,
    country: req.body.country,
    cnicNumber: req.body.cnicNumber,
    cityFrom: req.body.cityFrom,
    currentCity: req.body.currentCity,
    fullName: req.body.fullName,
    gender: req.body.gender,
    profilePicture: req.file ? req.file.path : null,
    profession: req.body.profession,
    age: req.body.age,
    officialMobile: req.body.officialMobile,
    personalMobile: req.body.personalMobile,
    whatsappMobile: req.body.whatsappMobile,
    officialEmail: req.body.officialEmail,
    personalEmail: req.body.personalEmail,
    maritalStatus: req.body.maritalStatus,
    dependants: req.body.dependants,
    currentAddress: req.body.currentAddress,
    contactPreference: req.body.contactPreference
  };

  try {
    const newCustomer = new Customer(customerData);
    await newCustomer.save();

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({ message: 'Failed to add customer', error: error.message });
  }
};

module.exports = createCustomer;

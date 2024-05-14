const Customer = require('../models/customer');

// Assuming you have a function for creating a customer
const createCustomer = async (req, res) => {
    // Create a customer object using the request body
    // Include profilePicture if the file was uploaded
    const customerData = {
        cnicNumber: req.body.cnicNumber,
        cityFrom: req.body.cityFrom,
        currentCity: req.body.currentCity,
        fullName: req.body.fullName,
        gender: req.body.gender,
        profession: req.body.profession,
        age: req.body.age,
        mobileNumber: req.body.mobileNumber,
        officialMobileNumber: req.body.officialMobileNumber,
        whatsappNumber: req.body.whatsappNumber,
        personalEmail: req.body.personalEmail,
        officialEmail: req.body.officialEmail,
        maritalStatus: req.body.maritalStatus,
        currentAddress: req.body.currentAddress,
        preferredContact: req.body.preferredContact,
        profilePicture: req.file ? req.file.path : null // Set the path if file is uploaded
    };

    try {
        // Create a new customer instance and save it to the database
        const newCustomer = new Customer(customerData);
        await newCustomer.save();

        // Respond with the new customer data, HTTP status code 201 Created
        res.status(201).json(newCustomer);
    } catch (error) {
        // If there's an error, respond with the error message, HTTP status code 400 Bad Request
        res.status(400).json({ message: error.message });
    }
};



module.exports = createCustomer;

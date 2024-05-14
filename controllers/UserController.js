// backend/controllers/user.controller.js
const User = require('../models/UserModel');

// Controller for handling user signup
exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, userRole, cnic, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password, // In a real application, you should hash the password before saving it
            userRole,
            cnic,
            phoneNumber,
        });

        // Save user to database
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// You can add more controller functions for other user operations like login, update, delete, etc.

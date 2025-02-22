const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createInitialAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email: 'admin2@gmail.com' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit(0);
        }

        // Create new admin - let the model handle password hashing
        const admin = new Admin({
            email: 'admin@gmail.com',
            password: 'Pakistan@2021', // Model will hash this automatically
            firstName: 'Admin',
            lastName: 'User'
        });

        const savedAdmin = await admin.save();
        console.log('Initial admin created successfully:', {
            id: savedAdmin._id,
            email: savedAdmin.email,
            firstName: savedAdmin.firstName,
            lastName: savedAdmin.lastName
        });

        // Verify the admin was created
        const verifyAdmin = await Admin.findOne({ email: 'admin2@gmail.com' });
        if (verifyAdmin) {
            console.log('Verified admin exists in database');
            
            // Test password comparison
            const isPasswordValid = await verifyAdmin.comparePassword('Pakistan@2021');
            console.log('Password verification test:', isPasswordValid);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating initial admin:', error);
        process.exit(1);
    }
}

createInitialAdmin();
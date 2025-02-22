// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('Authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            throw new Error('Admin access required');
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            throw new Error('Admin not found');
        }

        req.admin = admin;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = adminAuth;
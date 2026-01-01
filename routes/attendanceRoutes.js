const express = require('express');
const router = express.Router();
const { punchIn, punchOut } = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/verifyToken');
const Attendance = require('../models/attendance');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/punch-in', authenticateToken, asyncHandler(punchIn));
router.post('/punch-out', authenticateToken, asyncHandler(punchOut));

router.get('/agency/:agencyId', authenticateToken, asyncHandler(async (req, res) => {
    try {
        const { agencyId } = req.params;
        if (req.user.role !== 'admin' && req.user.agencyId !== agencyId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const attendanceRecords = await Attendance.find({ agencyId: agencyId }).populate('userId', 'name'); // Populating 'userId' to get user details, adjust fields as necessary

        if (!attendanceRecords) {
            return res.status(404).json({ message: 'No attendance records found for this agency.' });
        }

        res.json(attendanceRecords);
    } catch (error) {
        console.error('Failed to fetch attendance records:', error);
        res.status(500).json({ message: 'Server error while retrieving attendance records.' });
    }
}));

module.exports = router;

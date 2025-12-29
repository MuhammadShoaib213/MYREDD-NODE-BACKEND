const Attendance = require('../models/attendance');

exports.punchIn = async (req, res) => {
  try {
    console.log('Attempting to punch in:', req.body);
    const { location } = req.body;
    const userId = req.user.id;
    const agencyId = req.user.agencyId || req.body.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: 'Agency ID is required' });
    }

    const newRecord = await Attendance.create({
      userId,
      punchIn: new Date(),
      location,
      agencyId
    });
    console.log('Punched in successfully:', newRecord);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error during punch in:', error);
    res.status(500).json({ message: 'Failed to punch in', error: error.message });
  }
};

exports.punchOut = async (req, res) => {
  try {
    console.log('Attempting to punch out:', req.body);
    const userId = req.user.id;
    const agencyId = req.user.agencyId || req.body.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: 'Agency ID is required' });
    }

    const record = await Attendance.findOneAndUpdate(
      { userId, agencyId, punchOut: { $exists: false } },
      { punchOut: new Date() },
      { new: true }
    );
    if (record) {
      console.log('Punched out successfully:', record);
      res.status(200).json(record);
    } else {
      console.log('No record found to punch out for:', req.body);
      res.status(404).json({ message: 'No ongoing punch record found for this user.' });
    }
  } catch (error) {
    console.error('Error during punch out:', error);
    res.status(500).json({ message: 'Failed to punch out', error: error.message });
  }
};



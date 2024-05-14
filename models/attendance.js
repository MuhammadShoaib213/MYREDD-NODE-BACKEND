const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
  location: { type: String },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);

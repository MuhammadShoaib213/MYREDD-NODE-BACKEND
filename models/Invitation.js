const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviteeEmail: { type: String },
  inviteePhone: { type: String },
  inviteMethod: { type: String, enum: ['email', 'sms'], required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
});

module.exports = mongoose.model('Invitation', invitationSchema);

// // models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   userRole: { type: String, enum: ['agent', 'agency'], required: true },
//   cnic: { type: String, required: true },
//   phoneNumber: { type: String, required: true }
// });

// const User = mongoose.model('User', userSchema);

// module.exports = User;


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userRole: { type: String, enum: ['agent', 'agency'], required: true },
  cnic: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // not required as only agents will have this
  otp: { type: String },
  otp_expiration: { type: Date },
  is_verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;

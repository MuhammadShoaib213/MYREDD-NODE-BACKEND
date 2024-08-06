
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userRole: { type: String, enum: ['agent', 'agency'], required: true },
  cnic: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  whatsappNumber: { type: String }, // New field for WhatsApp number
  otp: { type: String },
  otp_expiration: { type: Date },
  passOtp: { type: String },
  passOtpExpiration: { type: Date },
  is_verified: { type: Boolean, default: false },
  // New fields as specified
  profilePicture: { type: String },
  country: { type: String },
  city: { type: String },
  location: { type: String },
  businessInfo: { type: String },
  businessLogo: { type: String }, // URL to the business logo image
  businessName: { type: String },
  businessOwnerName: { type: String },
  businessWorkingArea: { type: String },
  businessNTN: { type: String }, // National Tax Number
  residential: { type: String }, // Assuming text data about residential services
  commercial: { type: String }, // Assuming text data about commercial services
  land: { type: String }, // Assuming text data about land services
  experience: { type: Number }, // Assuming numerical value for years of experience
  skills: { type: [String] }, // Array of skills
  dateOfBirth: { type: Date },
  age: { type: Number },
  profileCompletion: { type: Number, default: 30 },
});



const User = mongoose.model('User', userSchema);

module.exports = User;

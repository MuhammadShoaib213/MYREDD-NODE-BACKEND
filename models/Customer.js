const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  country: { type: String, required: true }, 
  cnicNumber: { type: String, required: true, unique: true },
  cityFrom: { type: String, required: true }, // This should match "customerCity" if that's what the form uses
  currentCity: { type: String, required: true }, // Confirm this matches the form field name
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  profilePicture: { type: String }, // Make sure your form uses "image" as the field name if you use upload.single('image')
  profession: { type: String },
  age: { type: Number },
  officialMobile: { type: String }, // Assuming the form uses "officialMobile"
  personalMobile: { type: String }, // Assuming the form uses "personalMobile"
  whatsappMobile: { type: String }, // Assuming the form uses "whatsappMobile"
  officialEmail: { type: String },
  personalEmail: { type: String },
  maritalStatus: { type: String },
  dependants: { type: Number }, // Assuming you need to capture the number of dependants if married
  currentAddress: { type: String },
  contactPreference: { type: String } // Assuming the form uses "contactPreference"
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);

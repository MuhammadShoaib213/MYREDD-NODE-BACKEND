const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Don't include in queries by default
  },
  
  userRole: { 
    type: String, 
    enum: {
      values: ['agent', 'agency', 'admin'],
      message: '{VALUE} is not a valid user role'
    },
    required: [true, 'User role is required'],
    default: 'agent'
  },
  
  cnic: { 
    type: String, 
    required: [true, 'CNIC is required'],
    unique: true,
    match: [
      /^[0-9]{13}$/,
      'CNIC must be exactly 13 digits'
    ]
  },
  
  phoneNumber: { 
    type: String, 
    required: [true, 'Phone number is required'],
    match: [
      /^\+?[0-9]{10,15}$/,
      'Please provide a valid phone number'
    ]
  },
  
  whatsappNumber: { 
    type: String,
    match: [
      /^\+?[0-9]{10,15}$/,
      'Please provide a valid WhatsApp number'
    ]
  },
  
  // OTP fields - add expiration validation
  otp: { 
    type: String,
    select: false  // Security: don't expose in queries
  },
  otp_expiration: { 
    type: Date,
    select: false
  },
  
  passOtp: { 
    type: String,
    select: false
  },
  passOtpExpiration: { 
    type: Date,
    select: false
  },
  
  // Password reset token
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  is_verified: { 
    type: Boolean, 
    default: false 
  },
  
  profilePicture: { 
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Profile picture must be an image file'
    }
  },

  businessLogo: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Business logo must be an image file'
    }
  },
  
  country: { 
    type: String,
    trim: true,
    maxlength: [100, 'Country name too long']
  },
  
  city: { 
    type: String,
    trim: true,
    maxlength: [100, 'City name too long']
  },

  location: {
    type: String,
    trim: true,
    maxlength: [255, 'Location too long']
  },

  businessInfo: {
    type: String,
    trim: true
  },

  businessName: {
    type: String,
    trim: true
  },

  businessOwnerName: {
    type: String,
    trim: true
  },

  businessWorkingArea: {
    type: String,
    trim: true
  },

  businessNTN: {
    type: String,
    trim: true
  },

  residential: {
    type: String,
    trim: true
  },

  commercial: {
    type: String,
    trim: true
  },

  land: {
    type: String,
    trim: true
  },

  skills: {
    type: [String],
    default: []
  },

  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency'
  },
  
  experience: { 
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [100, 'Experience value too high']
  },
  
  age: { 
    type: Number,
    min: [18, 'Must be at least 18 years old'],
    max: [120, 'Invalid age']
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        const age = (new Date() - v) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 18;
      },
      message: 'User must be at least 18 years old'
    }
  },
  
  profileCompletion: { 
    type: Number, 
    default: 30,
    min: 0,
    max: 100
  },
  
  // Track account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ cnic: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ agencyId: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password reset token is valid
userSchema.methods.isResetTokenValid = function() {
  return this.passwordResetExpires && this.passwordResetExpires > Date.now();
};

module.exports = mongoose.model('User', userSchema);

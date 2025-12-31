const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  customerId: { 
    type: String, 
    required: [true, 'Customer ID is required'],
    unique: true
  },
  
  cnicNumber: { 
    type: String, 
    required: [true, 'CNIC is required'],
    match: [/^[0-9]{13}$/, 'CNIC must be exactly 13 digits']
  },
  
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name too short'],
    maxlength: [100, 'Name too long']
  },
  
  gender: { 
    type: String, 
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other'],
      message: '{VALUE} is not a valid gender'
    }
  },
  
  age: { 
    type: Number,
    min: [18, 'Customer must be at least 18'],
    max: [150, 'Invalid age']
  },
  
  officialMobile: { 
    type: String,
    match: [/^\+?[0-9]{10,15}$/, 'Invalid phone number format']
  },
  
  personalMobile: { 
    type: String,
    match: [/^\+?[0-9]{10,15}$/, 'Invalid phone number format']
  },
  
  officialEmail: { 
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  
  personalEmail: { 
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  
  maritalStatus: { 
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  
  dependants: { 
    type: Number,
    min: [0, 'Dependants cannot be negative'],
    max: [50, 'Value too large']
  },
  
  contactPreference: { 
    type: String,
    enum: ['phone', 'whatsapp', 'email', 'any']
  },

  profilePicture: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: 'Profile picture must be an image file'
    }
  }
}, {
  timestamps: true
});

// Compound unique index: Each user can only have one customer with same CNIC
customerSchema.index({ userId: 1, cnicNumber: 1 }, { unique: true });
customerSchema.index({ userId: 1, createdAt: -1 });
customerSchema.index({ customerId: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);

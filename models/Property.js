const mongoose = require('mongoose');

// ... (FacilitiesSchema, FloorSchema, etc. remain the same)

const PropertySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'],
    index: true  // Index for multi-tenant queries
  },
  
  cnicNumber: { 
    type: String, 
    required: [true, 'CNIC number is required'],
    match: [/^[0-9]{13}$/, 'CNIC must be exactly 13 digits']
  },

  city: { 
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name too long']
  },
  
  inquiryType: { 
    type: String, 
    enum: {
      values: ['For Sale', 'For Rent', 'For Purchase', 'On Rent'],
      message: '{VALUE} is not a valid inquiry type'
    },
    required: [true, 'Inquiry type is required']
  },
  
  propertyType: { 
    type: String, 
    enum: {
      values: ['residential', 'commercial', 'land'],
      message: '{VALUE} is not a valid property type'
    },
    required: [true, 'Property type is required']
  },
  
  propertySubType: {
    type: String,
    enum: {
      values: [
        'home', 'apartment', 'villa', 'duplex', 'condo', 'studio', 
        'farmhouse', 'chalet', 'building', 'hotel', 'office', 'shop', 
        'warehouse', 'cold_storage', 'factory', 'light_manufacturing', 
        'heavy_manufacturing', 'agricultural', 'commercial_land', 
        'residential_land', 'farm', 'industrial_land', 'educational', 'raw_land'
      ],
      message: '{VALUE} is not a valid property sub-type'
    }
  },
  
  size: { 
    type: Number,
    min: [0, 'Size cannot be negative'],
    max: [1000000, 'Size value too large']
  },
  
  demand: { 
    type: Number, 
    default: 0,
    min: [0, 'Demand cannot be negative'],
    max: [999999999999, 'Demand value too large']
  },
  
  status: { 
    type: String, 
    enum: {
      values: ['New', 'Active', 'Pending', 'Sold', 'Rented', 'Closed', 'Expired'],
      message: '{VALUE} is not a valid status'
    },
    default: 'New' 
  },
  
  priority: { 
    type: String, 
    enum: {
      values: ['thisMonth', 'nextMonth', 'urgent'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'thisMonth' 
  },
  
  frontPictures: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Maximum 10 front pictures allowed'
    }
  },
  
  propertyPictures: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 20;
      },
      message: 'Maximum 20 property pictures allowed'
    }
  },
  
  propertyCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  }
}, { 
  timestamps: true 
});

// Compound indexes for common query patterns
PropertySchema.index({ userId: 1, createdAt: -1 });
PropertySchema.index({ userId: 1, status: 1 });
PropertySchema.index({ userId: 1, inquiryType: 1 });
PropertySchema.index({ userId: 1, city: 1 });
PropertySchema.index({ userId: 1, propertyType: 1 });

// Pre-save validation
PropertySchema.pre('save', function(next) {
  // Ensure status transitions are valid
  if (this.isModified('status') && !this.isNew) {
    const validTransitions = {
      'New': ['Active', 'Closed'],
      'Active': ['Pending', 'Sold', 'Rented', 'Closed'],
      'Pending': ['Active', 'Sold', 'Rented', 'Closed'],
      'Sold': ['Closed'],
      'Rented': ['Active', 'Closed'],
      'Closed': [],
      'Expired': ['Active']
    };
    
    // Note: For this to work, you'd need to track the previous status
    // This is just an example of how validation can be extended
  }
  next();
});

module.exports = mongoose.model('Property', PropertySchema);
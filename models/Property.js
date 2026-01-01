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

  district: {
    type: String,
    trim: true,
    maxlength: [100, 'District name too long']
  },

  areaSociety: {
    type: String,
    trim: true,
    maxlength: [120, 'Area/Society name too long']
  },

  phaseBlock: {
    type: String,
    trim: true,
    maxlength: [120, 'Phase/Block name too long']
  },

  detectedAddress: {
    type: String,
    trim: true,
    maxlength: [255, 'Address too long']
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

  sizeUnit: {
    type: String,
    trim: true
  },

  coveredWidth: {
    type: Number,
    min: [0, 'Covered width cannot be negative']
  },

  coveredLength: {
    type: Number,
    min: [0, 'Covered length cannot be negative']
  },

  coveredDepth: {
    type: Number,
    min: [0, 'Covered depth cannot be negative']
  },

  coveredUnit: {
    type: String,
    trim: true
  },

  landWidth: {
    type: Number,
    min: [0, 'Land width cannot be negative']
  },

  landLength: {
    type: Number,
    min: [0, 'Land length cannot be negative']
  },

  landDepth: {
    type: Number,
    min: [0, 'Land depth cannot be negative']
  },

  landUnit: {
    type: String,
    trim: true
  },

  propertyNumber: {
    type: Number
  },

  streetName: {
    type: String,
    trim: true
  },

  Streetwidth: {
    type: Number
  },

  StreetwidthUnit: {
    type: String,
    trim: true
  },

  floors: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  facilities: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  
  demand: { 
    type: Number, 
    default: 0,
    min: [0, 'Demand cannot be negative'],
    max: [999999999999, 'Demand value too large']
  },

  advancePayment: {
    type: Number,
    min: [0, 'Advance payment cannot be negative']
  },

  mainOption: {
    type: String,
    trim: true
  },

  budget: {
    min: {
      type: Number,
      min: [0, 'Budget min cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Budget max cannot be negative']
    }
  },

  commission: {
    type: {
      type: String,
      enum: {
        values: ['percentage', 'value', 'fixed'],
        message: '{VALUE} is not a valid commission type'
      }
    },
    value: {
      type: Number,
      min: [0, 'Commission value cannot be negative']
    }
  },

  addedValue: {
    type: {
      type: String,
      enum: {
        values: ['percentage', 'value', 'fixed'],
        message: '{VALUE} is not a valid added value type'
      }
    },
    value: {
      type: Number,
      min: [0, 'Added value cannot be negative']
    }
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

  video: {
    type: String,
    trim: true
  },

  propertyCondition: {
    type: String,
    trim: true
  },

  contractTerm: {
    type: String,
    trim: true
  },

  // Legacy/compat fields used by older views
  purpose: {
    type: String,
    trim: true
  },

  area: {
    type: String,
    trim: true
  },

  category: {
    type: String,
    trim: true
  },

  features: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },

  bedrooms: {
    type: Number,
    min: [0, 'Bedrooms cannot be negative']
  },

  length: {
    type: Number,
    min: [0, 'Length cannot be negative']
  },

  width: {
    type: Number,
    min: [0, 'Width cannot be negative']
  },

  expected: {
    type: Number,
    min: [0, 'Expected value cannot be negative']
  },

  closingDate: {
    type: Date
  },

  timeForPayment: {
    type: String,
    trim: true
  },

  images: {
    type: [String],
    default: []
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

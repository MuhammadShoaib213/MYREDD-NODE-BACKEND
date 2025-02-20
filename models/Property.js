// models/Property.js
const mongoose = require('mongoose');

// Schema for Facilities
const FacilitiesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Facility name (e.g., "Water")
    value: { type: String, enum: ['Y', 'N'], default: 'N' }, // Boolean equivalent ("Y" or "N")
  },
  { _id: false }
);

// Schema for Floor
const FloorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Floor name (e.g., "Ground Floor")
    features: {
      type: Map,
      of: Number, // Features as key-value pairs (e.g., { "Bedroom": 2, "Lounge": 1 })
    },
  },
  { _id: false }
);

// Schema for Budget
const BudgetSchema = new mongoose.Schema(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  { _id: false }
);

// Schema for Commission and AddedValue
const ValueSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, default: 0 },
  },
  { _id: false }
);

// Main Property Schema
const PropertySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
    cnicNumber: { type: String, required: true },
    selectedCountry: { type: String },
    city: { type: String },
    district: { type: String }, // Added district
    phaseBlock: { type: String },
    detectedAddress: { type: String },
    size: { type: Number },
    sizeUnit: { type: String, default: 'marla' },
    coveredWidth: { type: Number },
    coveredLength: { type: Number },
    coveredDepth: { type: Number },
    coveredUnit: { type: String, default: 'feet' },
    landWidth: { type: Number },
    landLength: { type: Number },
    landDepth: { type: Number },
    landUnit: { type: String, default: 'feet' },
    propertyNumber: { type: String },
    streetName: { type: String },
    Streetwidth: { type: Number },
    StreetwidthUnit: { type: String },
    propertyCondition: { type: String, enum: ['new', 'old'], default: 'new' },
    demand: { type: Number, default: 0 },
    contractTerm: { type: String }, // Added contractTerm
    mainOption: { type: String },
    areaSociety: { type: String }, // Ensure frontend sends this or remove if unused
    inquiryType: { type: String, enum: ['For Sale', 'For Rent', 'For Purchase', 'On Rent'] },
    propertyType: { type: String, enum: ['residential', 'commercial', 'land'] },
    propertySubType: { 
      type: String, 
      enum: [
        'home', 'apartment', 'villas', 'duplex', 'condos', 'studio', 'farmHouse',
        'chalet', ' building', 'hotel', 'light manufacturing', ' heavy manufcaturing', 'cold storage',
        'office', 'shop', 'warehouse', 'factory', 'agricultural',
        'commercial', 'residential','agricultural','farm','industrial','education','raw'
      ] 
    },
    facilities: [FacilitiesSchema],
    floors: [FloorSchema],
    budget: BudgetSchema,
    advancePayment: { type: Number }, // Renamed from advanceAmount for consistency
    priority: { type: String, enum: ['thisMonth', 'nextMonth', 'urgent'], default: 'thisMonth' },
    commission: ValueSchema,
    addedValue: ValueSchema,
    frontPictures: [{ type: String, default: [] }], // Array of strings for front pictures
    propertyPictures: [{ type: String, default: [] }], // Array of strings for property pictures
    video: { type: String },
    propertyCode: { type: String, unique: true },
    status: { type: String, default: 'New' },
    contractTerm: { type: String }, // Ensure added
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', PropertySchema);

module.exports = Property;

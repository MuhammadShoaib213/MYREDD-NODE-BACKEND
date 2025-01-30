// // // // // const mongoose = require('mongoose');

// // // // // const PropertySchema = new mongoose.Schema({
// // // // //   userId: {
// // // // //     type: mongoose.Schema.Types.ObjectId,
// // // // //     ref: 'User'
// // // // //   },
// // // // //   cnicNumber: { type: String, required: true, match: /^\d{16}$/ },
// // // // //   typeFor: { type: String, required: false },
// // // // //   type: { type: String, required: true },
// // // // //   subType: { type: String, required: true },
// // // // //   title: { type: String, required: true },
// // // // //   address: { type: String, required: true },
// // // // //   geolocation: { type: String, required: true },
// // // // //   area: { type: String, required: true },
// // // // //   features: {
// // // // //     bedrooms: Number,
// // // // //     bathrooms: Number,
// // // // //     pool: Boolean,
// // // // //     garden: Boolean,
// // // // //     garage: Boolean
// // // // //   },
// // // // //   images: [String],
// // // // //   video: String,
// // // // //   availability: { type: String, required: true },
// // // // //   priceDemand: { type: Number, required: true },
// // // // //   priceFinal: { type: Number },
// // // // //   status: { type: String, required: true }
// // // // // }, {
// // // // //   timestamps: true
// // // // // });

// // // // // module.exports = mongoose.model('Property', PropertySchema);


// // // // const mongoose = require('mongoose');

// // // // const PropertySchema = new mongoose.Schema({
// // // //   userId: mongoose.Schema.Types.ObjectId,  // Assuming you are tracking which user adds the property.
// // // //   purpose: { type: String, required: true },
// // // //   inquiryType: {
// // // //     forPurchase: Boolean,
// // // //     forSale: Boolean,
// // // //     onRent: Boolean,
// // // //     forRent: Boolean
// // // //   },
// // // //   propertyType: {
// // // //     residential: Boolean,
// // // //     commercial: Boolean,
// // // //     land: Boolean
// // // //   },
// // // //   propertySubType: {
// // // //     home: Boolean,
// // // //     apartment: Boolean,
// // // //     villas: Boolean,
// // // //     farmHouse: Boolean,
// // // //     office: Boolean,
// // // //     shop: Boolean,
// // // //     warehouse: Boolean,
// // // //     factory: Boolean
// // // //   },
// // // //   city: String,
// // // //   area: String,
// // // //   phaseBlock: String,
// // // //   category: String,
// // // //   features: {
// // // //     garage: Boolean,
// // // //     garden: Boolean,
// // // //     mainRoad: Boolean,
// // // //     nearMasjid: Boolean  // Added based on possible feature mentioned
// // // //   },
// // // //   bedrooms: Number,
// // // //   budget: Number,
// // // //   advancePayment: Number,
// // // //   timeForPayment: String
// // // // }, {
// // // //   timestamps: true
// // // // });

// // // // const Property = mongoose.model('Property', PropertySchema);


// // // const mongoose = require('mongoose');

// // // const PropertySchema = new mongoose.Schema({
// // //   userId: mongoose.Schema.Types.ObjectId,
// // //   cnicNumber: { type: String, required: true},
// // //   propertyNumber: { type: Number, unique: true },
// // //   propertyCode: { type: String, unique: true },
// // //   status: String,
// // //   priority: String,
// // //   commission: Number,
// // //   inquiryType: {
// // //     forPurchase: Boolean,
// // //     forSale: Boolean,
// // //     onRent: Boolean,
// // //     forRent: Boolean
// // //   },
// // //   propertyType: {
// // //     residential: Boolean,
// // //     commercial: Boolean,
// // //     land: Boolean
// // //   },
// // //   propertySubType: {
// // //     home: Boolean,
// // //     apartment: Boolean,
// // //     villas: Boolean,
// // //     farmHouse: Boolean,
// // //     office: Boolean,
// // //     shop: Boolean,
// // //     warehouse: Boolean,
// // //     factory: Boolean,
// // //     agricultural: Boolean,
// // //     commercial: Boolean,
// // //     residential: Boolean
// // //   },
// // //   city: String,
// // //   area: String,
// // //   phaseBlock: String,
// // //   category: String,
// // //   features: {
// // //     garage: Boolean,
// // //     garden: Boolean,
// // //     mainRoad: Boolean,
// // //     nearMasjid: Boolean
// // //   },
// // //   bedrooms: Number,
// // //   length: Number,
// // //   width: Number,
// // //   budget: Number,
// // //   advancePayment: Number,
// // //   expected: Number,
// // //   closingDate: Date, 
// // //   timeForPayment: String,
// // //   images: [String],
// // //   video: String
// // // }, {
// // //   timestamps: true
// // // });

// // // const Property = mongoose.model('Property', PropertySchema);

// // // module.exports = Property;


// // // models/Property.js
// // const mongoose = require('mongoose');

// // const FloorSchema = new mongoose.Schema({
// //   name: { type: String },
// //   features: { type: Object }, // Stores features as key-value pairs without Mongoose _id
// // }, { _id: false });

// // const CommissionSchema = new mongoose.Schema({
// //   type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
// //   value: { type: Number, default: 0 },
// // }, { _id: false });

// // const AddedValueSchema = new mongoose.Schema({
// //   type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
// //   value: { type: Number, default: 0 },
// // }, { _id: false });

// // const BudgetSchema = new mongoose.Schema({
// //   min: { type: Number, default: 0 },
// //   max: { type: Number, default: 0 },
// // }, { _id: false });

// // const FacilitiesSchema = new mongoose.Schema({
// //   name: { type: String },
// //   value: { type: String, enum: ['Y', 'N'], default: 'N' }, // Ensures only 'Y' or 'N' are stored
// // }, { _id: false });

// // const PropertySchema = new mongoose.Schema(
// //   {
// //     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User model if applicable
// //     cnicNumber: { type: String, required: true },
// //     selectedCountry: { type: String },
// //     propertyNumber: { type: String, unique: true },
// //     propertyCode: { type: String, unique: true },
// //     status: { type: String, default: 'New' },
// //     priority: { type: String },
// //     commission: CommissionSchema,
// //     addedValue: AddedValueSchema,
// //     inquiryType: { type: String, enum: ['For Sale', 'For Rent', 'For Purchase', 'On Rent'], required: true },
// //     propertyType: { type: String, enum: ['residential', 'commercial', 'land'], required: true },
// //     propertySubType: { type: String, enum: ['home', 'apartment', 'villas', 'farmHouse', 'office', 'shop', 'warehouse', 'factory', 'agricultural'], required: true },
// //     city: { type: String, required: true },
// //     area: { type: String },
// //     phaseBlock: { type: String },
// //     detectedAddress: { type: String },
// //     size: { type: Number },
// //     sizeUnit: { type: String, default: 'marla' },
// //     coveredWidth: { type: Number },
// //     coveredLength: { type: Number },
// //     coveredDepth: { type: Number },
// //     coveredUnit: { type: String, default: 'feet' },
// //     landWidth: { type: Number },
// //     landLength: { type: Number },
// //     landDepth: { type: Number },
// //     landUnit: { type: String, default: 'feet' },
// //     propertyNumber: { type: String },
// //     streetName: { type: String },
// //     Streetwidth: { type: Number },
// //     StreetwidthUnit: { type: String },
// //     propertyCondition: { type: String, enum: ['new', 'old'], default: 'new' },
// //     demand: { type: Number, default: 0 },
// //     mainOption: { type: String },
// //     areaSociety: { type: String },
// //     facilities: [FacilitiesSchema], // Array of facility objects
// //     floors: [FloorSchema], // Array of floor objects
// //     budget: BudgetSchema,
// //     advancePayment: { type: Number },
// //     images: [String],
// //     video: { type: String },
// //   },
// //   {
// //     timestamps: true,
// //   }
// // );

// // const Property = mongoose.model('Property', PropertySchema);

// // module.exports = Property;


// // models/Property.js
// const mongoose = require('mongoose');

// // Schema for Facilities
// const FacilitiesSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true }, // Facility name (e.g., "Water")
//     value: { type: String, enum: ['Y', 'N'], default: 'N' }, // Boolean equivalent ("Y" or "N")
//   },
//   { _id: false }
// );

// // Schema for Floor
// const FloorSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true }, // Floor name (e.g., "Ground Floor")
//     features: {
//       type: Map,
//       of: Number, // Features as key-value pairs (e.g., { "Bedroom": 2, "Lounge": 1 })
//     },
//   },
//   { _id: false }
// );

// // Main Property Schema
// const PropertySchema = new mongoose.Schema(
//   {
//     cnicNumber: { type: String, required: true },
//     selectedCountry: { type: String },
//     city: { type: String },
//     phaseBlock: { type: String },
//     detectedAddress: { type: String },
//     size: { type: Number },
//     sizeUnit: { type: String, default: 'marla' },
//     coveredWidth: { type: Number },
//     coveredLength: { type: Number },
//     coveredDepth: { type: Number },
//     coveredUnit: { type: String, default: 'feet' },
//     landWidth: { type: Number },
//     landLength: { type: Number },
//     landDepth: { type: Number },
//     landUnit: { type: String, default: 'feet' },
//     propertyNumber: { type: String },
//     streetName: { type: String },
//     Streetwidth: { type: Number },
//     StreetwidthUnit: { type: String },
//     propertyCondition: { type: String, enum: ['new', 'old'], default: 'new' },
//     demand: { type: Number, default: 0 },
//     mainOption: { type: String },
//     areaSociety: { type: String },
//     inquiryType: { type: String, enum: ['For Sale', 'For Rent', 'For Purchase', 'On Rent'] },
//     propertyType: { type: String, enum: ['residential', 'commercial', 'land'] },
//     propertySubType: { type: String, enum: ['home', 'apartment', 'villas', 'farmHouse', 'office', 'shop', 'warehouse', 'factory', 'agricultural'] },
//     facilities: [FacilitiesSchema], // Updated to include name and value
//     floors: [FloorSchema], // Updated to store name and features
//     budget: {
//       min: { type: Number, default: 0 },
//       max: { type: Number, default: 0 },
//     },
//     advancePayment: { type: Number },
//     priority: { type: String, enum: ['thisMonth', 'nextMonth', 'urgent'], default: 'thisMonth' },
//     commission: {
//       type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
//       value: { type: Number, default: 0 },
//     },
//     addedValue: {
//       type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
//       value: { type: Number, default: 0 },
//     },
//     images: { type: [String], default: [] },
//     video: { type: String },
//     propertyCode: { type: String, unique: true },
//     status: { type: String, default: 'New' },
//   },
//   { timestamps: true }
// );

// const Property = mongoose.model('Property', PropertySchema);

// module.exports = Property;


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
        'home', 'apartment', 'villas', 'farmHouse', 
        'office', 'shop', 'warehouse', 'factory', 'agricultural'
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

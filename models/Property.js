// // const mongoose = require('mongoose');

// // const PropertySchema = new mongoose.Schema({
// //   userId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User'
// //   },
// //   cnicNumber: { type: String, required: true, match: /^\d{16}$/ },
// //   typeFor: { type: String, required: false },
// //   type: { type: String, required: true },
// //   subType: { type: String, required: true },
// //   title: { type: String, required: true },
// //   address: { type: String, required: true },
// //   geolocation: { type: String, required: true },
// //   area: { type: String, required: true },
// //   features: {
// //     bedrooms: Number,
// //     bathrooms: Number,
// //     pool: Boolean,
// //     garden: Boolean,
// //     garage: Boolean
// //   },
// //   images: [String],
// //   video: String,
// //   availability: { type: String, required: true },
// //   priceDemand: { type: Number, required: true },
// //   priceFinal: { type: Number },
// //   status: { type: String, required: true }
// // }, {
// //   timestamps: true
// // });

// // module.exports = mongoose.model('Property', PropertySchema);


// const mongoose = require('mongoose');

// const PropertySchema = new mongoose.Schema({
//   userId: mongoose.Schema.Types.ObjectId,  // Assuming you are tracking which user adds the property.
//   purpose: { type: String, required: true },
//   inquiryType: {
//     forPurchase: Boolean,
//     forSale: Boolean,
//     onRent: Boolean,
//     forRent: Boolean
//   },
//   propertyType: {
//     residential: Boolean,
//     commercial: Boolean,
//     land: Boolean
//   },
//   propertySubType: {
//     home: Boolean,
//     apartment: Boolean,
//     villas: Boolean,
//     farmHouse: Boolean,
//     office: Boolean,
//     shop: Boolean,
//     warehouse: Boolean,
//     factory: Boolean
//   },
//   city: String,
//   area: String,
//   phaseBlock: String,
//   category: String,
//   features: {
//     garage: Boolean,
//     garden: Boolean,
//     mainRoad: Boolean,
//     nearMasjid: Boolean  // Added based on possible feature mentioned
//   },
//   bedrooms: Number,
//   budget: Number,
//   advancePayment: Number,
//   timeForPayment: String
// }, {
//   timestamps: true
// });

// const Property = mongoose.model('Property', PropertySchema);


const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  cnicNumber: { type: String, required: true},
  propertyNumber: { type: Number, unique: true },
  propertyCode: { type: String, unique: true },
  purpose: { type: String, required: false },
  status: String,
  priority: String,
  commission: Number,
  inquiryType: {
    forPurchase: Boolean,
    forSale: Boolean,
    onRent: Boolean,
    forRent: Boolean
  },
  propertyType: {
    residential: Boolean,
    commercial: Boolean,
    land: Boolean
  },
  propertySubType: {
    home: Boolean,
    apartment: Boolean,
    villas: Boolean,
    farmHouse: Boolean,
    office: Boolean,
    shop: Boolean,
    warehouse: Boolean,
    factory: Boolean,
    agricultural: Boolean,
    commercial: Boolean,
    residential: Boolean
  },
  city: String,
  area: String,
  phaseBlock: String,
  category: String,
  features: {
    garage: Boolean,
    garden: Boolean,
    mainRoad: Boolean,
    nearMasjid: Boolean
  },
  bedrooms: Number,
  length: Number,
  width: Number,
  budget: Number,
  advancePayment: Number,
  expected: Number,
  closingDate: Date, 
  timeForPayment: String,
  images: [String],
  video: String
}, {
  timestamps: true
});

const Property = mongoose.model('Property', PropertySchema);

module.exports = Property;
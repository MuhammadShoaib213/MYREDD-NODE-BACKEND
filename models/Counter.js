// models/Counter.js - NEW FILE for atomic ID generation
const mongoose = require('mongoose');

/**
 * Counter model for generating sequential IDs atomically
 * This prevents race conditions when multiple requests try to get the next ID
 */
const counterSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  seq: { 
    type: Number, 
    default: 0 
  }
}, {
  // Disable versioning for counters - atomic operations handle concurrency
  versionKey: false
});

/**
 * Get the next sequence value atomically
 * Uses findOneAndUpdate with $inc to ensure atomic increment
 * 
 * @param {string} name - The name/identifier of the counter (e.g., 'propertyNumber', 'customerId')
 * @returns {Promise<number>} - The next sequence number
 * 
 * @example
 * const Counter = require('../models/Counter');
 * const nextPropertyNumber = await Counter.getNextSequence('propertyNumber');
 * // Returns: 1, 2, 3, etc.
 */
counterSchema.statics.getNextSequence = async function(name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { 
      new: true,      // Return the updated document
      upsert: true,   // Create if doesn't exist
      setDefaultsOnInsert: true
    }
  );
  return counter.seq;
};

/**
 * Get the next sequence with padding
 * 
 * @param {string} name - The counter name
 * @param {number} padding - Number of digits to pad to (default: 6)
 * @returns {Promise<string>} - Padded sequence string
 * 
 * @example
 * const customerId = await Counter.getNextSequencePadded('customerId', 4);
 * // Returns: '0001', '0002', etc.
 */
counterSchema.statics.getNextSequencePadded = async function(name, padding = 6) {
  const seq = await this.getNextSequence(name);
  return seq.toString().padStart(padding, '0');
};

/**
 * Reset a counter (use with caution - mainly for testing)
 * 
 * @param {string} name - The counter name
 * @param {number} value - Value to reset to (default: 0)
 */
counterSchema.statics.resetCounter = async function(name, value = 0) {
  await this.findByIdAndUpdate(
    name,
    { seq: value },
    { upsert: true }
  );
};

/**
 * Get current value without incrementing
 * 
 * @param {string} name - The counter name
 * @returns {Promise<number>} - Current sequence number (0 if doesn't exist)
 */
counterSchema.statics.getCurrentValue = async function(name) {
  const counter = await this.findById(name);
  return counter ? counter.seq : 0;
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;

/**
 * USAGE EXAMPLES:
 * 
 * // In propertyController.js:
 * const Counter = require('../models/Counter');
 * 
 * exports.addProperty = async (req, res) => {
 *   try {
 *     // Get atomic property number - no race condition!
 *     const propertyNumber = await Counter.getNextSequencePadded('propertyNumber', 6);
 *     // propertyNumber will be '000001', '000002', etc.
 *     
 *     const newProperty = new Property({
 *       ...req.body,
 *       propertyNumber,
 *       userId: req.user.id, // From authenticated user
 *     });
 *     
 *     await newProperty.save();
 *     res.status(201).json({ message: 'Property added', property: newProperty });
 *   } catch (error) {
 *     // ...
 *   }
 * };
 * 
 * // In customerController.js:
 * exports.addCustomer = async (req, res) => {
 *   try {
 *     const customerId = await Counter.getNextSequencePadded('customerId', 4);
 *     // customerId will be '0001', '0002', etc.
 *     
 *     const newCustomer = new Customer({
 *       ...req.body,
 *       customerId,
 *       userId: req.user.id,
 *     });
 *     
 *     await newCustomer.save();
 *     res.status(201).json({ message: 'Customer added', customer: newCustomer });
 *   } catch (error) {
 *     // ...
 *   }
 * };
 */

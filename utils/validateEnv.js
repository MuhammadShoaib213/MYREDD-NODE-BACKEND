// utils/validateEnv.js - NEW FILE
/**
 * Environment Variable Validation
 * Run this at application startup to fail fast if config is missing
 */

const requiredEnvVars = [
  { name: 'MONGODB_URI', description: 'MongoDB connection string' },
  { name: 'JWT_SECRET', description: 'JWT signing secret', minLength: 32 },
  { name: 'PORT', description: 'Server port', default: '6003' },
];

const optionalEnvVars = [
  { name: 'NODE_ENV', description: 'Environment mode', default: 'development' },
  { name: 'STRIPE_SECRET_KEY', description: 'Stripe API key' },
  { name: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook secret' },
  { name: 'TWILIO_ACCOUNT_SID', description: 'Twilio account SID' },
  { name: 'TWILIO_AUTH_TOKEN', description: 'Twilio auth token' },
  { name: 'TWILIO_PHONE_NUMBER', description: 'Twilio phone number' },
  { name: 'OTP_SMTP_USER', description: 'SMTP username for OTP emails' },
  { name: 'OTP_SMTP_PASS', description: 'SMTP password for OTP emails' },
  { name: 'CONTACT_SMTP_USER', description: 'SMTP username for contact form' },
  { name: 'CONTACT_SMTP_PASS', description: 'SMTP password for contact form' },
  { name: 'GOOGLE_API_KEY', description: 'Google Maps API key' },
  { name: 'CLIENT_URL', description: 'Frontend URL for CORS', default: 'http://localhost:3000' },
  { name: 'REDIS_URL', description: 'Redis URL for Socket.io adapter' },
];

// Known insecure values that should be rejected
const insecureValues = {
  JWT_SECRET: ['SECRET_KEY', 'secret', 'jwt_secret', 'your_secret_here', 'change_me'],
  MONGODB_URI: ['mongodb://localhost', 'mongodb://127.0.0.1'],
};

/**
 * Validate all environment variables
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(({ name, description, minLength, default: defaultVal }) => {
    const value = process.env[name];
    
    if (!value) {
      if (defaultVal) {
        process.env[name] = defaultVal;
        warnings.push(`${name} not set, using default: ${defaultVal}`);
      } else {
        errors.push(`Missing required: ${name} (${description})`);
      }
      return;
    }

    // Check minimum length
    if (minLength && value.length < minLength) {
      errors.push(`${name} must be at least ${minLength} characters`);
    }

    // Check for insecure values
    if (insecureValues[name]?.includes(value)) {
      errors.push(`${name} is set to an insecure value. Please use a secure random value.`);
    }
  });

  // Check optional variables
  optionalEnvVars.forEach(({ name, description, default: defaultVal }) => {
    const value = process.env[name];
    
    if (!value) {
      if (defaultVal) {
        process.env[name] = defaultVal;
      } else {
        warnings.push(`Optional ${name} not set (${description})`);
      }
    }
  });

  // Special validations
  if (process.env.NODE_ENV === 'production') {
    // In production, more variables become required
    const productionRequired = ['STRIPE_SECRET_KEY', 'OTP_SMTP_USER', 'OTP_SMTP_PASS'];
    productionRequired.forEach(name => {
      if (!process.env[name]) {
        errors.push(`${name} is required in production`);
      }
    });

    // Warn about localhost URLs in production
    if (process.env.CLIENT_URL?.includes('localhost')) {
      warnings.push('CLIENT_URL contains localhost in production mode');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate and exit if invalid
 * Call this at the very start of your application
 */
const validateEnvOrExit = () => {
  console.log('🔍 Validating environment configuration...\n');
  
  const { valid, errors, warnings } = validateEnv();

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  // Print errors and exit if any
  if (!valid) {
    console.error('❌ Environment validation failed:\n');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nPlease fix the above issues and restart the server.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
  return true;
};

/**
 * Get a typed environment variable with default
 * @param {string} name - Variable name
 * @param {*} defaultValue - Default value if not set
 * @returns {string}
 */
const getEnv = (name, defaultValue = '') => {
  return process.env[name] || defaultValue;
};

/**
 * Get an integer environment variable
 * @param {string} name - Variable name
 * @param {number} defaultValue - Default value
 * @returns {number}
 */
const getEnvInt = (name, defaultValue = 0) => {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Get a boolean environment variable
 * @param {string} name - Variable name
 * @param {boolean} defaultValue - Default value
 * @returns {boolean}
 */
const getEnvBool = (name, defaultValue = false) => {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

/**
 * Check if running in production
 * @returns {boolean}
 */
const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 * @returns {boolean}
 */
const isDevelopment = () => {
  return process.env.NODE_ENV !== 'production';
};

module.exports = {
  validateEnv,
  validateEnvOrExit,
  getEnv,
  getEnvInt,
  getEnvBool,
  isProduction,
  isDevelopment
};


/**
 * USAGE:
 * 
 * // At the very top of index.js, after require('dotenv').config():
 * require('dotenv').config();
 * const { validateEnvOrExit } = require('./utils/validateEnv');
 * validateEnvOrExit(); // Will exit with error if validation fails
 * 
 * // Then continue with rest of application
 * const express = require('express');
 * // ...
 */

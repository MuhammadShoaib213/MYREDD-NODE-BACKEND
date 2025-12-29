// utils/startup.js - Centralized Startup Validation & Graceful Shutdown
// Call this at the VERY START of your index.js/server.js

/**
 * Environment Validation
 * Must be called before any other imports that depend on env vars
 */
const validateEnvironment = () => {
  const required = [
    { name: 'MONGODB_URI', minLength: 10 },
    { name: 'JWT_SECRET', minLength: 32 },
  ];

  const optional = [
    'PORT',
    'NODE_ENV',
    'STRIPE_SECRET_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'OTP_SMTP_USER',
    'OTP_SMTP_PASS',
    'GOOGLE_API_KEY',
    'CLIENT_URL',
  ];

  const errors = [];
  const warnings = [];

  // Check required variables
  required.forEach(({ name, minLength }) => {
    const value = process.env[name];
    if (!value) {
      errors.push(`Missing required: ${name}`);
    } else if (minLength && value.length < minLength) {
      errors.push(`${name} must be at least ${minLength} characters`);
    }
  });

  // Check for insecure defaults
  if (process.env.JWT_SECRET === 'SECRET_KEY') {
    errors.push('JWT_SECRET is set to insecure default "SECRET_KEY"');
  }

  // Warn about missing optional vars
  optional.forEach(name => {
    if (!process.env[name]) {
      warnings.push(`Optional: ${name} not set`);
    }
  });

  // Set defaults
  process.env.PORT = process.env.PORT || '6003';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  return { errors, warnings };
};

/**
 * Validate and exit if critical errors
 */
const assertEnvironment = () => {
  console.log('🔍 Validating environment...\n');
  
  const { errors, warnings } = validateEnvironment();

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation FAILED:\n');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\nFix the above issues and restart.\n');
    process.exit(1);
  }

  console.log('✅ Environment validated\n');
};

/**
 * Setup Global Error Handlers
 * Call this early in your startup sequence
 */
const setupGlobalErrorHandlers = () => {
  // Unhandled Promise Rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    
    // In production, you might want to:
    // 1. Log to external service (Sentry, LogRocket, etc.)
    // 2. Gracefully shutdown
    // For now, we log and continue (don't crash)
  });

  // Uncaught Exceptions
  process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:');
    console.error(error);
    
    // Uncaught exceptions are more serious - server state may be corrupted
    // Best practice: log, cleanup, and exit
    console.error('Server will restart due to uncaught exception...');
    
    // Give time for logging, then exit (PM2 will restart)
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  console.log('✅ Global error handlers registered\n');
};

/**
 * Setup Graceful Shutdown
 * Important for PM2, Docker, Kubernetes deployments
 * 
 * @param {Object} server - HTTP server instance
 * @param {Object} mongoose - Mongoose instance
 * @param {Object} io - Socket.io instance (optional)
 */
const setupGracefulShutdown = (server, mongoose, io = null) => {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        console.error('Error closing server:', err);
      } else {
        console.log('✅ HTTP server closed');
      }

      // Close Socket.io connections
      if (io) {
        io.close(() => {
          console.log('✅ Socket.io closed');
        });
      }

      // Close database connection
      try {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed');
      } catch (dbErr) {
        console.error('Error closing MongoDB:', dbErr);
      }

      console.log('👋 Shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/Kubernetes
  process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart

  console.log('✅ Graceful shutdown handlers registered\n');
};

/**
 * MongoDB Connection with Retry Logic
 * 
 * @param {string} uri - MongoDB connection URI
 * @param {Object} options - Mongoose connection options
 * @returns {Promise<void>}
 */
const connectDatabase = async (uri, options = {}) => {
  const mongoose = require('mongoose');
  
  const defaultOptions = {
    maxPoolSize: 50,           // Support for concurrent users
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,                 // Use IPv4
  };

  const connOptions = { ...defaultOptions, ...options };

  // Connection event handlers
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
  });

  // Attempt connection with retry
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(uri, connOptions);
      return mongoose;
    } catch (err) {
      retries--;
      console.error(`MongoDB connection failed. Retries left: ${retries}`);
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after all retries');
        throw err;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = {
  validateEnvironment,
  assertEnvironment,
  setupGlobalErrorHandlers,
  setupGracefulShutdown,
  connectDatabase,
};


/**
 * USAGE IN index.js / server.js:
 * 
 * require('dotenv').config();
 * 
 * // Step 1: Validate environment FIRST (before other imports)
 * const { 
 *   assertEnvironment, 
 *   setupGlobalErrorHandlers,
 *   setupGracefulShutdown,
 *   connectDatabase 
 * } = require('./utils/startup');
 * 
 * assertEnvironment(); // Will exit if config is wrong
 * setupGlobalErrorHandlers();
 * 
 * // Step 2: Now safe to import other modules
 * const express = require('express');
 * const mongoose = require('mongoose');
 * // ... other imports
 * 
 * // Step 3: Setup app and start server
 * const app = express();
 * const server = http.createServer(app);
 * const io = require('./sockets')(server);
 * 
 * // Step 4: Connect DB and start
 * connectDatabase(process.env.MONGODB_URI)
 *   .then(() => {
 *     server.listen(process.env.PORT, () => {
 *       console.log(`Server running on port ${process.env.PORT}`);
 *       setupGracefulShutdown(server, mongoose, io);
 *     });
 *   })
 *   .catch(err => {
 *     console.error('Failed to start server:', err);
 *     process.exit(1);
 *   });
 */

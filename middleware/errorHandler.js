// // middleware/errorHandler.js - REVISED: Distinguishes Operational vs Programming Errors

// /**
//  * Custom Application Error Class
//  * Use this for operational errors (expected errors)
//  */
// class AppError extends Error {
//   constructor(message, statusCode, code = null) {
//     super(message);
//     this.statusCode = statusCode;
//     this.code = code;
//     this.isOperational = true;
    
//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// /**
//  * Common operational errors factory
//  */
// const errors = {
//   badRequest: (message = 'Bad request', code = 'BAD_REQUEST') => 
//     new AppError(message, 400, code),
    
//   unauthorized: (message = 'Authentication required', code = 'UNAUTHORIZED') => 
//     new AppError(message, 401, code),
    
//   forbidden: (message = 'Access denied', code = 'FORBIDDEN') => 
//     new AppError(message, 403, code),
    
//   notFound: (resource = 'Resource', code = 'NOT_FOUND') => 
//     new AppError(`${resource} not found`, 404, code),
    
//   conflict: (message = 'Resource already exists', code = 'CONFLICT') => 
//     new AppError(message, 409, code),
    
//   validation: (message = 'Validation failed', details = [], code = 'VALIDATION_ERROR') => {
//     const error = new AppError(message, 400, code);
//     error.details = details;
//     return error;
//   },
    
//   tooManyRequests: (message = 'Too many requests', code = 'RATE_LIMITED') => 
//     new AppError(message, 429, code),
// };

// /**
//  * Determine if error is operational (expected) vs programming (bug)
//  */
// const isOperationalError = (error) => {
//   // Our custom AppError
//   if (error.isOperational === true) {
//     return true;
//   }
  
//   // Mongoose validation errors (user input issues)
//   if (error.name === 'ValidationError') {
//     return true;
//   }
  
//   // Mongoose cast errors (invalid ObjectId format)
//   if (error.name === 'CastError') {
//     return true;
//   }
  
//   // MongoDB duplicate key (unique constraint)
//   if (error.code === 11000) {
//     return true;
//   }
  
//   // JWT errors (invalid/expired tokens)
//   if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
//     return true;
//   }
  
//   // Multer errors (file upload issues)
//   if (error.code && error.code.startsWith('LIMIT_')) {
//     return true;
//   }
  
//   // Everything else is a programming error
//   return false;
// };

// /**
//  * Format error response based on type
//  */
// const formatErrorResponse = (error, includeStack = false) => {
//   const response = {
//     success: false,
//     error: {
//       message: error.message || 'An error occurred',
//       code: error.code || 'INTERNAL_ERROR'
//     }
//   };
  
//   // Include validation details if present
//   if (error.details) {
//     response.error.details = error.details;
//   }
  
//   // Include stack in development
//   if (includeStack && error.stack) {
//     response.error.stack = error.stack;
//   }
  
//   return response;
// };

// /**
//  * Handle Mongoose validation errors
//  */
// const handleMongooseValidationError = (error) => {
//   const details = Object.values(error.errors).map(err => ({
//     field: err.path,
//     message: err.message,
//     value: err.value
//   }));
  
//   return errors.validation('Validation failed', details);
// };

// /**
//  * Handle Mongoose duplicate key errors
//  */
// const handleDuplicateKeyError = (error) => {
//   const field = Object.keys(error.keyValue)[0];
//   const value = error.keyValue[field];
  
//   return errors.conflict(
//     `${field} '${value}' already exists`,
//     'DUPLICATE_KEY'
//   );
// };

// /**
//  * Handle Mongoose cast errors (invalid ObjectId, etc.)
//  */
// const handleCastError = (error) => {
//   return errors.badRequest(
//     `Invalid ${error.path}: ${error.value}`,
//     'INVALID_ID'
//   );
// };

// /**
//  * Handle JWT errors
//  */
// const handleJWTError = (error) => {
//   if (error.name === 'TokenExpiredError') {
//     return errors.unauthorized('Token has expired', 'TOKEN_EXPIRED');
//   }
//   return errors.unauthorized('Invalid token', 'TOKEN_INVALID');
// };

// /**
//  * Handle Multer errors
//  */
// const handleMulterError = (error) => {
//   const messages = {
//     LIMIT_FILE_SIZE: 'File too large',
//     LIMIT_FILE_COUNT: 'Too many files',
//     LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
//     LIMIT_PART_COUNT: 'Too many parts',
//     LIMIT_FIELD_KEY: 'Field name too long',
//     LIMIT_FIELD_VALUE: 'Field value too long',
//     LIMIT_FIELD_COUNT: 'Too many fields'
//   };
  
//   return errors.badRequest(
//     messages[error.code] || 'File upload error',
//     error.code
//   );
// };

// /**
//  * Main Error Handler Middleware
//  * 
//  * IMPORTANT: This must be registered AFTER all routes
//  * 
//  * @example
//  * // In index.js
//  * app.use('/api/...', routes);
//  * app.use(notFoundHandler);
//  * app.use(errorHandler);
//  */
// const errorHandler = (err, req, res, next) => {
//   // Default status code
//   let statusCode = err.statusCode || 500;
//   let error = err;
  
//   const isDev = process.env.NODE_ENV === 'development';
  
//   // Log all errors
//   console.error(`[${new Date().toISOString()}] ERROR:`, {
//     path: req.path,
//     method: req.method,
//     userId: req.user?.id || 'anonymous',
//     message: err.message,
//     stack: isDev ? err.stack : undefined,
//     isOperational: isOperationalError(err)
//   });
  
//   // Transform known error types to AppError
//   if (err.name === 'ValidationError' && err.errors) {
//     error = handleMongooseValidationError(err);
//     statusCode = error.statusCode;
//   } else if (err.code === 11000) {
//     error = handleDuplicateKeyError(err);
//     statusCode = error.statusCode;
//   } else if (err.name === 'CastError') {
//     error = handleCastError(err);
//     statusCode = error.statusCode;
//   } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
//     error = handleJWTError(err);
//     statusCode = error.statusCode;
//   } else if (err.code && err.code.startsWith('LIMIT_')) {
//     error = handleMulterError(err);
//     statusCode = error.statusCode;
//   }
  
//   // For programming errors in production, hide details
//   if (!isOperationalError(err) && !isDev) {
//     statusCode = 500;
//     error = {
//       message: 'Internal server error',
//       code: 'INTERNAL_ERROR',
//       isOperational: false
//     };
//   }
  
//   // Send response
//   res.status(statusCode).json(
//     formatErrorResponse(error, isDev)
//   );
// };

// /**
//  * 404 Not Found Handler
//  * Place BEFORE errorHandler, AFTER all routes
//  */
// const notFoundHandler = (req, res, next) => {
//   next(errors.notFound('Endpoint'));
// };

// /**
//  * Async Handler Wrapper
//  * Automatically catches async errors and passes to error handler
//  * 
//  * @example
//  * router.get('/items', asyncHandler(async (req, res) => {
//  *   const items = await Item.find();
//  *   res.json(items);
//  * }));
//  */
// const asyncHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// module.exports = {
//   errorHandler,
//   notFoundHandler,
//   asyncHandler,
//   AppError,
//   errors,
//   isOperationalError
// };


// /**
//  * USAGE IN CONTROLLERS:
//  * 
//  * const { errors, asyncHandler } = require('../middleware/errorHandler');
//  * 
//  * // Wrap async functions
//  * exports.getItem = asyncHandler(async (req, res) => {
//  *   const item = await Item.findById(req.params.id);
//  *   
//  *   if (!item) {
//  *     throw errors.notFound('Item');
//  *   }
//  *   
//  *   res.json(item);
//  * });
//  * 
//  * // For validation errors
//  * exports.createItem = asyncHandler(async (req, res) => {
//  *   const { name, price } = req.body;
//  *   
//  *   if (!name) {
//  *     throw errors.validation('Validation failed', [
//  *       { field: 'name', message: 'Name is required' }
//  *     ]);
//  *   }
//  *   
//  *   // ...
//  * });
//  * 
//  * // For authorization errors
//  * exports.deleteItem = asyncHandler(async (req, res) => {
//  *   const item = await Item.findById(req.params.id);
//  *   
//  *   if (!item) {
//  *     throw errors.notFound('Item');
//  *   }
//  *   
//  *   if (item.userId.toString() !== req.user.id) {
//  *     throw errors.forbidden('You can only delete your own items');
//  *   }
//  *   
//  *   await item.remove();
//  *   res.status(204).send();
//  * });
//  */


// middleware/errorHandler.js - PRODUCTION HARDENED
// Fixes: flat response format, 413 for file size, correlation ID, no path leaks

const crypto = require('crypto');

/**
 * Custom Application Error Class
 * Use this for operational errors (expected errors)
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common operational errors factory
 */
const errors = {
  badRequest: (message = 'Bad request', code = 'BAD_REQUEST') => 
    new AppError(message, 400, code),
    
  unauthorized: (message = 'Authentication required', code = 'UNAUTHORIZED') => 
    new AppError(message, 401, code),
    
  forbidden: (message = 'Access denied', code = 'FORBIDDEN') => 
    new AppError(message, 403, code),
    
  notFound: (resource = 'Resource', code = 'NOT_FOUND') => 
    new AppError(`${resource} not found`, 404, code),
    
  conflict: (message = 'Resource already exists', code = 'CONFLICT') => 
    new AppError(message, 409, code),
    
  payloadTooLarge: (message = 'File too large', code = 'PAYLOAD_TOO_LARGE') =>
    new AppError(message, 413, code),
    
  validation: (message = 'Validation failed', details = [], code = 'VALIDATION_ERROR') => {
    const error = new AppError(message, 400, code);
    error.details = details;
    return error;
  },
    
  tooManyRequests: (message = 'Too many requests', code = 'RATE_LIMITED') => 
    new AppError(message, 429, code),
};

/**
 * Determine if error is operational (expected) vs programming (bug)
 */
const isOperationalError = (error) => {
  if (error.isOperational === true) return true;
  if (error.name === 'ValidationError') return true;
  if (error.name === 'CastError') return true;
  if (error.code === 11000) return true;
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return true;
  if (error.code && error.code.startsWith('LIMIT_')) return true;
  return false;
};

/**
 * Generate request correlation ID for log tracing
 */
const generateCorrelationId = () => {
  return crypto.randomBytes(8).toString('hex');
};

/**
 * Sanitize error message - remove file paths and sensitive info
 */
const sanitizeMessage = (message) => {
  if (!message || typeof message !== 'string') return 'An error occurred';
  
  // Remove file paths (Unix and Windows)
  let sanitized = message
    .replace(/\/[^\s:]+\.(js|ts|json|mjs)/gi, '[file]')
    .replace(/[A-Z]:\\[^\s:]+\.(js|ts|json|mjs)/gi, '[file]')
    .replace(/at\s+[^\s]+\s+\([^)]+\)/g, '') // Remove stack trace lines
    .replace(/\/home\/[^\/]+/g, '[home]')
    .replace(/\/var\/[^\s]+/g, '[path]')
    .replace(/node_modules\/[^\s]+/g, '[module]');
  
  return sanitized.trim() || 'An error occurred';
};

/**
 * Format error response - FLAT FORMAT for frontend compatibility
 * Response shape: { success, message, code, ?details, ?requestId }
 */
const formatErrorResponse = (error, requestId, includeDetails = false) => {
  const response = {
    success: false,
    message: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
  };
  
  // Include validation details if present
  if (error.details && Array.isArray(error.details)) {
    response.details = error.details;
  }
  
  // Include request ID for support/debugging
  if (requestId) {
    response.requestId = requestId;
  }
  
  // Include stack ONLY in development
  if (includeDetails && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
};

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (error) => {
  const details = Object.values(error.errors || {}).map(err => ({
    field: err.path,
    message: err.message,
  }));
  
  return errors.validation('Validation failed', details);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || 'field';
  return errors.conflict(`${field} already exists`, 'DUPLICATE_KEY');
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleCastError = (error) => {
  // Don't expose the actual invalid value in production
  return errors.badRequest('Invalid ID format', 'INVALID_ID');
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return errors.unauthorized('Session expired. Please login again.', 'TOKEN_EXPIRED');
  }
  return errors.unauthorized('Invalid authentication token', 'TOKEN_INVALID');
};

/**
 * Handle Multer errors
 * IMPORTANT: LIMIT_FILE_SIZE returns 413 (not 400)
 */
const handleMulterError = (error) => {
  // File too large → 413 Payload Too Large
  if (error.code === 'LIMIT_FILE_SIZE') {
    return errors.payloadTooLarge('File exceeds maximum size limit');
  }
  
  // Too many files → 400
  if (error.code === 'LIMIT_FILE_COUNT') {
    return errors.badRequest('Too many files uploaded', 'TOO_MANY_FILES');
  }
  
  // Unexpected field → 400
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return errors.badRequest('Unexpected file field', 'UNEXPECTED_FIELD');
  }
  
  // Other multer errors → 400
  return errors.badRequest('File upload error', error.code || 'UPLOAD_ERROR');
};

/**
 * Main Error Handler Middleware
 * 
 * IMPORTANT: Must be registered AFTER all routes
 * 
 * Features:
 * - Flat JSON response format (frontend compatible)
 * - Request correlation ID for log tracing
 * - Stack trace hidden in production
 * - File paths sanitized
 * - 413 for file size errors
 */
const errorHandler = (err, req, res, next) => {
  // Generate correlation ID for this error
  const requestId = req.correlationId || generateCorrelationId();
  
  // Determine environment
  const isDev = process.env.NODE_ENV === 'development';
  
  // Default values
  let statusCode = err.statusCode || 500;
  let error = err;
  
  // Transform known error types
  if (err.name === 'ValidationError' && err.errors) {
    error = handleMongooseValidationError(err);
    statusCode = error.statusCode;
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
    statusCode = error.statusCode;
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
    statusCode = error.statusCode;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
    statusCode = error.statusCode;
  } else if (err.code && err.code.startsWith('LIMIT_')) {
    error = handleMulterError(err);
    statusCode = error.statusCode;
  }
  
  // ✅ Compute operational state using TRANSFORMED error (not original)
  const operational = isOperationalError(error);
  
  // For programming errors in production, hide ALL details
  if (!operational && !isDev) {
    statusCode = 500;
    error = {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
  }
  
  // Sanitize message in production
  if (!isDev && error.message) {
    error.message = sanitizeMessage(error.message);
  }
  
  // Log error (with full details for debugging)
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    level: 'error',
    path: req.path,
    method: req.method,
    userId: req.user?.id || req.user?.userId || null,
    statusCode,
    errorCode: error.code,
    message: err.message, // Original message for logs
    isOperational: operational,
    // Only include stack in logs (never in response unless dev)
    stack: err.stack,
  }));
  
  // Ensure response hasn't been sent already
  if (res.headersSent) {
    return next(err);
  }
  
  // Send FLAT JSON response
  res.status(statusCode).json(
    formatErrorResponse(error, requestId, isDev)
  );
};

/**
 * 404 Not Found Handler
 * Place BEFORE errorHandler, AFTER all routes
 */
const notFoundHandler = (req, res, next) => {
  next(errors.notFound('Endpoint'));
};

/**
 * Correlation ID Middleware
 * Place BEFORE routes to add correlation ID to all requests
 * 
 * @example
 * app.use(correlationIdMiddleware);
 * app.use('/api', routes);
 */
const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
};

/**
 * Async Handler Wrapper
 * Catches async errors and forwards to error handler
 * 
 * CRITICAL: Use this for EVERY async route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  correlationIdMiddleware,
  asyncHandler,
  AppError,
  errors,
  isOperationalError
};


/**
 * INTEGRATION EXAMPLE:
 * 
 * // index.js
 * const express = require('express');
 * const { 
 *   errorHandler, 
 *   notFoundHandler, 
 *   correlationIdMiddleware 
 * } = require('./middleware/errorHandler');
 * 
 * const app = express();
 * 
 * // Add correlation ID to all requests (FIRST)
 * app.use(correlationIdMiddleware);
 * 
 * app.use(express.json());
 * 
 * // Routes
 * app.use('/api/auth', require('./routes/auth'));
 * app.use('/api/customers', require('./routes/customers'));
 * 
 * // Error handling (LAST)
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 * 
 * 
 * RESPONSE FORMAT (FLAT):
 * 
 * Success: { ...data }
 * 
 * Error: {
 *   "success": false,
 *   "message": "Customer not found",
 *   "code": "NOT_FOUND",
 *   "requestId": "a1b2c3d4e5f6g7h8"
 * }
 * 
 * Validation Error: {
 *   "success": false,
 *   "message": "Validation failed",
 *   "code": "VALIDATION_ERROR",
 *   "details": [
 *     { "field": "name", "message": "Name is required" }
 *   ],
 *   "requestId": "a1b2c3d4e5f6g7h8"
 * }
 */

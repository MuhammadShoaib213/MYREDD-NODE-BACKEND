// middleware/errorHandler.js - REVISED: Distinguishes Operational vs Programming Errors

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
  // Our custom AppError
  if (error.isOperational === true) {
    return true;
  }
  
  // Mongoose validation errors (user input issues)
  if (error.name === 'ValidationError') {
    return true;
  }
  
  // Mongoose cast errors (invalid ObjectId format)
  if (error.name === 'CastError') {
    return true;
  }
  
  // MongoDB duplicate key (unique constraint)
  if (error.code === 11000) {
    return true;
  }
  
  // JWT errors (invalid/expired tokens)
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return true;
  }
  
  // Multer errors (file upload issues)
  if (error.code && error.code.startsWith('LIMIT_')) {
    return true;
  }
  
  // Everything else is a programming error
  return false;
};

/**
 * Format error response based on type
 */
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      message: error.message || 'An error occurred',
      code: error.code || 'INTERNAL_ERROR'
    }
  };
  
  // Include validation details if present
  if (error.details) {
    response.error.details = error.details;
  }
  
  // Include stack in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
};

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (error) => {
  const details = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: err.value
  }));
  
  return errors.validation('Validation failed', details);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  
  return errors.conflict(
    `${field} '${value}' already exists`,
    'DUPLICATE_KEY'
  );
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleCastError = (error) => {
  return errors.badRequest(
    `Invalid ${error.path}: ${error.value}`,
    'INVALID_ID'
  );
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return errors.unauthorized('Token has expired', 'TOKEN_EXPIRED');
  }
  return errors.unauthorized('Invalid token', 'TOKEN_INVALID');
};

/**
 * Handle Multer errors
 */
const handleMulterError = (error) => {
  const messages = {
    LIMIT_FILE_SIZE: 'File too large',
    LIMIT_FILE_COUNT: 'Too many files',
    LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    LIMIT_PART_COUNT: 'Too many parts',
    LIMIT_FIELD_KEY: 'Field name too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields'
  };
  
  return errors.badRequest(
    messages[error.code] || 'File upload error',
    error.code
  );
};

/**
 * Main Error Handler Middleware
 * 
 * IMPORTANT: This must be registered AFTER all routes
 * 
 * @example
 * // In index.js
 * app.use('/api/...', routes);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  // Default status code
  let statusCode = err.statusCode || 500;
  let error = err;
  
  const isDev = process.env.NODE_ENV === 'development';
  
  // Log all errors
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    path: req.path,
    method: req.method,
    userId: req.user?.id || 'anonymous',
    message: err.message,
    stack: isDev ? err.stack : undefined,
    isOperational: isOperationalError(err)
  });
  
  // Transform known error types to AppError
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
  
  // For programming errors in production, hide details
  if (!isOperationalError(err) && !isDev) {
    statusCode = 500;
    error = {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      isOperational: false
    };
  }
  
  // Send response
  res.status(statusCode).json(
    formatErrorResponse(error, isDev)
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
 * Async Handler Wrapper
 * Automatically catches async errors and passes to error handler
 * 
 * @example
 * router.get('/items', asyncHandler(async (req, res) => {
 *   const items = await Item.find();
 *   res.json(items);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  errors,
  isOperationalError
};


/**
 * USAGE IN CONTROLLERS:
 * 
 * const { errors, asyncHandler } = require('../middleware/errorHandler');
 * 
 * // Wrap async functions
 * exports.getItem = asyncHandler(async (req, res) => {
 *   const item = await Item.findById(req.params.id);
 *   
 *   if (!item) {
 *     throw errors.notFound('Item');
 *   }
 *   
 *   res.json(item);
 * });
 * 
 * // For validation errors
 * exports.createItem = asyncHandler(async (req, res) => {
 *   const { name, price } = req.body;
 *   
 *   if (!name) {
 *     throw errors.validation('Validation failed', [
 *       { field: 'name', message: 'Name is required' }
 *     ]);
 *   }
 *   
 *   // ...
 * });
 * 
 * // For authorization errors
 * exports.deleteItem = asyncHandler(async (req, res) => {
 *   const item = await Item.findById(req.params.id);
 *   
 *   if (!item) {
 *     throw errors.notFound('Item');
 *   }
 *   
 *   if (item.userId.toString() !== req.user.id) {
 *     throw errors.forbidden('You can only delete your own items');
 *   }
 *   
 *   await item.remove();
 *   res.status(204).send();
 * });
 */

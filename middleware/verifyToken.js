// middleware/verifyToken.js - REVISED (Safe Version)
// This middleware should NOT contain startup validation
// Startup validation belongs in your boot sequence (index.js/server.js)

const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Assumes JWT_SECRET is validated at application startup via validateEnv.js
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      error: 'Authorization header is required' 
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>' 
    });
  }

  const token = parts[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ 
      success: false,
      error: 'Token not provided' 
    });
  }

  // Use environment variable directly - validated at startup
  const secret = process.env.JWT_SECRET;
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token is invalid',
          code: 'TOKEN_INVALID'
        });
      } else {
        return res.status(401).json({ 
          success: false,
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

    // Attach minimal user data from token
    req.user = {
      id: decoded.userId || decoded.id || decoded._id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  });
};

/**
 * Role-based Authorization Middleware Factory
 * Use AFTER authenticateToken
 * 
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin/dashboard', authenticateToken, requireRole('admin'), handler);
 * router.get('/data', authenticateToken, requireRole('admin', 'agent'), handler);
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (!req.user.role) {
      return res.status(403).json({ 
        success: false,
        error: 'User role not defined' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Ownership verification middleware factory
 * Ensures the user can only access their own resources
 * 
 * @param {string} paramName - The request parameter containing resource owner ID
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/users/:userId/data', authenticateToken, requireOwnership('userId'), handler);
 */
const requireOwnership = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName];
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Allow admins to bypass ownership check
    if (req.user.role === 'admin') {
      return next();
    }

    if (resourceOwnerId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

module.exports = { 
  authenticateToken, 
  requireRole,
  requireOwnership
};

/**
 * REMOVED: refreshToken function
 * 
 * Reason: Refresh token implementation requires a complete design including:
 * - Separate refresh token with longer expiry
 * - Refresh token storage (database or Redis)
 * - Token rotation on refresh
 * - Revocation capability
 * 
 * If you need refresh tokens, implement them as a separate feature with:
 * 1. RefreshToken model in database
 * 2. /auth/refresh endpoint
 * 3. Token family tracking to detect theft
 * 4. Automatic revocation on password change
 */

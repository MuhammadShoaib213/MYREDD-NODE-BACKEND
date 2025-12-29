// middleware/uploadSecurity.js - Comprehensive File Upload Security
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * File Upload Security Configuration
 * Addresses:
 * - Path traversal attacks
 * - Filename sanitization
 * - MIME type validation
 * - File size limits
 * - DOS prevention
 * - Orphan file cleanup
 */

// Allowed MIME types with corresponding extensions
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // Videos
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  // Documents (if needed)
  'application/pdf': ['.pdf'],
};

// Size limits per file type (in bytes)
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB for images
  video: 100 * 1024 * 1024,   // 100MB for videos
  document: 20 * 1024 * 1024, // 20MB for documents
  default: 10 * 1024 * 1024,  // 10MB default
};

/**
 * Sanitize filename to prevent path traversal and special characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  // Get the extension
  const ext = path.extname(filename).toLowerCase();
  
  // Get basename without extension
  let name = path.basename(filename, ext);
  
  // Remove any path components (prevent path traversal)
  name = name.replace(/^.*[\\\/]/, '');
  
  // Remove special characters, keep only alphanumeric, dash, underscore
  name = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Limit length
  name = name.substring(0, 50);
  
  // If name is empty after sanitization, use random string
  if (!name) {
    name = 'file';
  }
  
  return name + ext;
};

/**
 * Generate unique filename with timestamp and random component
 * @param {string} originalFilename - Original filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalFilename) => {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized).toLowerCase();
  const name = path.basename(sanitized, ext);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}-${random}-${name}${ext}`;
};

/**
 * Validate MIME type against allowed list
 * Also checks that extension matches MIME type
 */
const validateMimeType = (file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();
  
  // Check if MIME type is allowed
  if (!ALLOWED_TYPES[mime]) {
    return cb(new Error(`File type not allowed: ${mime}`), false);
  }
  
  // Check if extension matches MIME type
  const allowedExts = ALLOWED_TYPES[mime];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Extension ${ext} does not match file type ${mime}`), false);
  }
  
  cb(null, true);
};

/**
 * Get size limit based on file type
 */
const getSizeLimit = (mimetype) => {
  if (mimetype.startsWith('image/')) return SIZE_LIMITS.image;
  if (mimetype.startsWith('video/')) return SIZE_LIMITS.video;
  if (mimetype === 'application/pdf') return SIZE_LIMITS.document;
  return SIZE_LIMITS.default;
};

/**
 * Create upload directory if it doesn't exist
 * @param {string} dir - Directory path
 */
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
};

/**
 * Create secure multer storage configuration
 * @param {string} uploadDir - Base upload directory
 * @param {string} subDir - Subdirectory for organization
 */
const createSecureStorage = (uploadDir = './uploads', subDir = '') => {
  const fullDir = path.join(uploadDir, subDir);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure directory exists
      ensureUploadDir(fullDir);
      
      // Verify directory is within expected path (prevent traversal)
      const resolvedDir = path.resolve(fullDir);
      const baseDir = path.resolve(uploadDir);
      
      if (!resolvedDir.startsWith(baseDir)) {
        return cb(new Error('Invalid upload directory'), null);
      }
      
      cb(null, fullDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    }
  });
};

/**
 * Create secure multer upload middleware
 * @param {Object} options - Configuration options
 * @returns {multer.Multer} Configured multer instance
 */
const createSecureUpload = (options = {}) => {
  const {
    uploadDir = './uploads',
    subDir = '',
    maxFileSize = SIZE_LIMITS.default,
    maxFiles = 10,
    allowedTypes = Object.keys(ALLOWED_TYPES),
  } = options;
  
  return multer({
    storage: createSecureStorage(uploadDir, subDir),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 20, // Limit non-file fields
      fieldSize: 1024 * 1024, // 1MB for text fields
    },
    fileFilter: (req, file, cb) => {
      // Check if MIME type is in allowed list
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
      }
      
      validateMimeType(file, cb);
    }
  });
};

/**
 * Property upload configuration
 */
const propertyUpload = createSecureUpload({
  uploadDir: './uploads',
  subDir: 'properties',
  maxFileSize: 50 * 1024 * 1024, // 50MB for property media
  maxFiles: 20,
});

/**
 * Profile picture upload configuration
 */
const profileUpload = createSecureUpload({
  uploadDir: './uploads',
  subDir: 'profiles',
  maxFileSize: 5 * 1024 * 1024, // 5MB for profile pictures
  maxFiles: 1,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

/**
 * Customer document upload configuration
 */
const customerUpload = createSecureUpload({
  uploadDir: './uploads',
  subDir: 'customers',
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,
});

/**
 * Delete uploaded file (for cleanup on error or orphan removal)
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>}
 */
const deleteUploadedFile = async (filePath) => {
  try {
    // Prevent path traversal in deletion
    const resolvedPath = path.resolve(filePath);
    const uploadsBase = path.resolve('./uploads');
    
    if (!resolvedPath.startsWith(uploadsBase)) {
      console.error('Attempted to delete file outside uploads directory');
      return false;
    }
    
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Cleanup uploaded files on request error
 * Use in error handlers or when DB save fails
 * @param {Object} req - Express request object
 */
const cleanupOnError = async (req) => {
  const files = [];
  
  // Handle single file
  if (req.file) {
    files.push(req.file.path);
  }
  
  // Handle multiple files
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(f => files.push(f.path));
    } else {
      // Handle .fields() format
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(f => files.push(f.path));
      });
    }
  }
  
  // Delete all uploaded files
  await Promise.all(files.map(deleteUploadedFile));
};

/**
 * Verify file ownership before allowing deletion
 * @param {Object} Model - Mongoose model
 * @param {string} fileField - Field name containing file path
 * @param {string} resourceId - Resource ID
 * @param {string} userId - User ID requesting deletion
 * @returns {Promise<{allowed: boolean, filePath?: string}>}
 */
const verifyFileOwnership = async (Model, fileField, resourceId, userId) => {
  try {
    const resource = await Model.findOne({
      _id: resourceId,
      userId: userId
    }).select(fileField);
    
    if (!resource) {
      return { allowed: false };
    }
    
    return { 
      allowed: true, 
      filePath: resource[fileField] 
    };
  } catch (error) {
    return { allowed: false };
  }
};

/**
 * Multer error handler middleware
 * Place after your upload middleware
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        maxSize: `${SIZE_LIMITS.default / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      details: err.message
    });
  }
  
  if (err.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  // Pass other errors to global handler
  next(err);
};

module.exports = {
  createSecureUpload,
  propertyUpload,
  profileUpload,
  customerUpload,
  deleteUploadedFile,
  cleanupOnError,
  verifyFileOwnership,
  handleUploadError,
  sanitizeFilename,
  ALLOWED_TYPES,
  SIZE_LIMITS,
};


/**
 * NGINX CONFIGURATION for serving uploads safely:
 * 
 * location /uploads/ {
 *     alias /path/to/your/uploads/;
 *     
 *     # Disable script execution
 *     location ~ \.(php|py|pl|cgi|asp|aspx|jsp)$ {
 *         deny all;
 *     }
 *     
 *     # Force download for potentially dangerous files
 *     location ~* \.(html|htm|js|css)$ {
 *         add_header Content-Disposition "attachment";
 *     }
 *     
 *     # Set proper content types
 *     types {
 *         image/jpeg jpg jpeg;
 *         image/png png;
 *         image/gif gif;
 *         video/mp4 mp4;
 *         application/pdf pdf;
 *     }
 *     
 *     # Cache static files
 *     expires 30d;
 *     add_header Cache-Control "public, immutable";
 *     
 *     # Security headers
 *     add_header X-Content-Type-Options "nosniff";
 *     add_header X-Frame-Options "DENY";
 * }
 */

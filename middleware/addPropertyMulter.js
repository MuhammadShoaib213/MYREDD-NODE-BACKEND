const multer = require('multer');
const path = require('path');
const { errors } = require('./errorHandler');

const sanitizeFilename = (filename) => {
  // Remove directory paths, keep only filename
  const basename = path.basename(filename);
  // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
  return basename.replace(/[^a-zA-Z0-9.-_]/g, '_').substring(0, 100);
};

const addPropertyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/properties/';
    // Ensure directory exists
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${uniqueSuffix}-${safeName}${ext}`);
  },
});

// File filter to validate file types (allow common mobile upload variants)
const addPropertyFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.mp4'];
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype === 'video/mp4';
  const isOctetImage =
    file.mimetype === 'application/octet-stream' && allowedExts.includes(ext);

  if (isImage || isVideo || isOctetImage) {
    cb(null, true);
  } else {
    console.error(
      `Property file rejected: name=${file.originalname} mime=${file.mimetype}`,
    );
    cb(
      errors.badRequest(
        'Invalid file type. Only JPEG, PNG, JPG, WEBP, and MP4 are allowed.',
        'INVALID_FILE_TYPE',
      ),
      false,
    );
  }
};

// Multer upload configuration
const addPropertyUpload = multer({
  storage: addPropertyStorage,
  fileFilter: addPropertyFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB if needed
}).fields([
  { name: 'frontPictures', maxCount: 10 }, // Adjust maxCount as needed
  { name: 'propertyPictures', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);

module.exports = addPropertyUpload;

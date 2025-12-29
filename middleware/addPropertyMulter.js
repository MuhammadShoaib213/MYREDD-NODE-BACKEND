const multer = require('multer');
const path = require('path');

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

// File filter to validate file types
const addPropertyFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'video/mp4',
    // Add more types if needed
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, JPG, and MP4 are allowed.'),
      false
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
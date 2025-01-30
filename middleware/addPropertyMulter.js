const multer = require('multer');
const path = require('path');

// Define storage configuration
const addPropertyStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/properties/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
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
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const sanitizeFilename = (filename) => {
  const basename = path.basename(filename);
  return basename.replace(/[^a-zA-Z0-9.-_]/g, '_').substring(0, 100);
};

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'audio/webm',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg, and .webm format allowed!'), false);
    }
  }
}).fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'businessLogo', maxCount: 1 },
  { name: 'audio', maxCount: 1 } // Add this line to handle audio uploads
]);

module.exports = upload;

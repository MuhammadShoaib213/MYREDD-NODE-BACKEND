const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { errors } = require('./errorHandler');

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

// ✅ FIXED: Added file size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 3
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/webm', 'video/webm'];
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.webm'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImage = file.mimetype.startsWith('image/');
    const isOctetStream =
      file.mimetype === 'application/octet-stream' &&
      allowedExts.includes(ext);

    if (isImage || allowedMimeTypes.includes(file.mimetype) || isOctetStream) {
      cb(null, true);
    } else {
      console.error(
        `Upload rejected: name=${file.originalname} mime=${file.mimetype}`,
      );
      cb(
        errors.badRequest(
          'Only .png, .jpg, .jpeg, .webp, and .webm formats allowed!',
          'INVALID_FILE_TYPE',
        ),
        false,
      );
    }
  }
}).fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'businessLogo', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

module.exports = upload;

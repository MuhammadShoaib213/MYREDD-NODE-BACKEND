const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'audio/webm'];
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

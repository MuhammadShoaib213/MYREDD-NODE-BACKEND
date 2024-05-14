const multer = require('multer');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');  // Ensure this directory exists
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Limit file size to 1MB, adjust as needed
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(null, false); // reject file
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
}).single('profilePicture'); // Ensure this matches the name attribute in your input tag

module.exports = upload;

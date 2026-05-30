const multer = require('multer');
const path = require('path');

// Store uploaded files in Public/images/uploads/.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'Public', 'images', 'uploads'));
  },
  filename: function (req, file, cb) {
    // Unique filename: userId_timestamp.ext
    const ext = path.extname(file.originalname);
    const userId = req.user ? req.user._id : 'anon';
    cb(null, `${userId}_${Date.now()}${ext}`);
  },
});

// Only allow image file types.
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeMatch = allowedTypes.test(file.mimetype);

  if (extMatch && mimeMatch) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;

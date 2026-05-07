const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_FILES_PER_REQUEST = Number(process.env.MAX_FILES_PER_REQUEST ?? 20);
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '..', 'uploads');
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {

    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDFs are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_FILES_PER_REQUEST,
  },
});

module.exports = upload;

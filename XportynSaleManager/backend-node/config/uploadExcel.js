const multer = require('multer');
const path = require('path');

/**
 * Excel / CSV upload ke liye alag multer config.
 * (Existing `config/upload.js` ko chhera nahi gaya — wo images/PDF ke liye hai.)
 *
 * Yahan memoryStorage use kiya hai: file disk par save nahi hoti,
 * seedha RAM me aati hai, hum parse karke MongoDB me daal dete hain.
 */
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error('Only .xlsx, .xls and .csv files are allowed'));
};

const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

module.exports = uploadExcel;

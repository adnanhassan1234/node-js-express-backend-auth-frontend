const multer = require('multer');
const path = require('path');

/**
 * PDF upload ke liye alag multer config.
 *
 * (`uploadExcel` sirf .xlsx/.xls/.csv leta hai, aur `config/upload.js` file ko
 * disk par rakhta hai -- yahan dono me se koi theek nahi tha.)
 *
 * memoryStorage: file disk par save nahi hoti. LinkedIn ka profile PDF padh
 * kar hum sirf naam, company waghera nikalte hain aur file bhool jate hain --
 * usay rakhne ki koi wajah nahi.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pdf') {
    return cb(null, true);
  }

  cb(new Error('Only .pdf files are allowed'));
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB -- profile PDF is se bohat chhoti hoti hai
});

module.exports = uploadPdf;

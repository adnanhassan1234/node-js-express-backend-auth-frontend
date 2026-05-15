const express = require('express');
const studentController = require('../controller/studentController');
const cookieController = require('../controller/cookieController');
const stripePaymentController = require('../controller/stripePaymentController');

const upload = require('../config/upload');
const authMiddleware = require('../middleware/auth');
const role = require('../middleware/role');

const router = express.Router();

router.get('/students', authMiddleware, role('admin'), studentController.getAllStudent);
router.get(
  '/students/search',
  authMiddleware,
  role('admin', 'user'),
  studentController.searchStudent
);
router.get(
  '/students-name',
  authMiddleware,
  role('admin', 'user'),
  studentController.searchStudentByName
);
router.get(
  '/students/:id',
  authMiddleware,
  role('admin', 'user'),
  studentController.getStudentById
);
// router.post('/students', authMiddleware, role('user'), studentController.addStudent);
router.post('/students', studentController.addStudent);
router.put(
  '/students/:id',
  authMiddleware,
  role('admin', 'user'),
  studentController.getStudentUpdate
);
router.delete(
  '/students/:id',
  authMiddleware,
  role('admin', 'user'),
  studentController.deleteStudent
);
router.post('/students/email', authMiddleware, role('admin', 'user'), studentController.sendEmail);
// router.post('/students/upload', upload.single('myFile'), studentController.studentUploadFile);
// for multiple file upload
router.post(
  '/students/upload',
  authMiddleware,
  role('admin', 'user'),
  upload.array('myFiles', 3),
  studentController.studentUploadFile
);

// cookie routes
router.get('/cookie', cookieController.setCookie);
router.get('/get-cookie', cookieController.getCookie);

// stripe payment route
// router.post('/create-payment', stripePaymentController.createPaymentIntent);
router.post('/create-checkout-session', stripePaymentController.createCheckoutSession);
// router.post(
//   '/stripe-webhook',
//   express.raw({ type: 'application/json' }),
//   stripePaymentController.handleWebhook
// );

// get all booking
router.get('/all-booking', studentController.allBooking);

module.exports = router;

const express = require('express');
const adminSqlController = require('../controllers/adminSqlController');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/admin_user', adminSqlController.gettALlAminUser);
router.get('/admin_user/:id', adminSqlController.getSingleAminUser);
router.post('/admin_user', adminSqlController.addAminUser);
router.put('/admin_user/:id', adminSqlController.updateAminUser);
router.delete('/admin_user/:id', adminSqlController.deleteAminUser);

// Auth routes
router.post('/register', userController.registerUser);
router.get('/verify-email', userController.verifyEmail);
router.post('/login', userController.loginUser);
router.post('/forget-password', userController.forgetPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.get('/all-users', userController.getAllUsers);
router.post('/refresh-token', userController.refreshToken);

module.exports = router;

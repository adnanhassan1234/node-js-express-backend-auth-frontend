const express = require('express');
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/auth');
const role = require('../middleware/role');

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.get('/verify-email', userController.verifyEmail);
router.put('/users/role/:id', authMiddleware, role('admin'), userController.updateUserRole);
router.get('/users', authMiddleware, role('admin'), userController.getAllUsers);
router.post('/refresh-token', userController.refreshTokenData);
router.post('/logout', userController.logoutUser);

module.exports = router;

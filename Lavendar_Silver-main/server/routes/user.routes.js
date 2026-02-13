const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');

router.get('/', auth, userController.getAllUsers);
router.post('/register', userController.register);
router.post('/login', userController.login);

// Forgot password routes
router.post('/send-otp', userController.sendOTP);
router.post('/verify-otp', userController.verifyOTP);
router.post('/reset-password', userController.resetPassword);

router.get('/status/check', auth, userController.checkUserStatus);
router.post('/change-password', auth, userController.changeUserPassword);
router.get('/:id', auth, userController.getUser);
router.put('/:id', auth, userController.updateUser);
router.patch('/:id/status', auth, userController.updateUserStatus);
router.delete('/:id', auth, userController.deleteUser);
router.patch('/:id/photo', auth, upload.single('photo', '/profiles'), userController.updateUserPhoto);

module.exports = router; 
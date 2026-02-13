const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { upload } = require('../middlewares/multer');
const authMiddleware = require('../middlewares/auth');

router.post('/admin/register', auth.registerAdmin);
router.post('/admin/login', auth.loginAdmin);
router.post('/admin/forgot-password', auth.forgotPasswordAdmin);
router.post('/admin/reset-password', auth.resetPasswordAdmin);

// Email update routes
router.post('/admin/send-email-update-otp', authMiddleware, auth.sendEmailUpdateOTP);
router.post('/admin/verify-email-update-otp', authMiddleware, auth.verifyEmailUpdateOTP);

// Password change route
router.post('/admin/change-password', authMiddleware, auth.changeAdminPassword);

router.post('/logout', auth.logout);
router.get('/whoami', auth.whoami);
router.patch('/admin/photo', authMiddleware, upload.single('photo', '/profiles'), auth.updateAdminPhoto);

module.exports = router;
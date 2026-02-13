const express = require('express');
const router = express.Router();
const google = require('../controllers/google.controller');

// Google OAuth endpoints
router.post('/login', google.googleLogin);
router.post('/signup', google.googleSignup);
router.post('/admin/login', google.googleAdminLogin);

module.exports = router;

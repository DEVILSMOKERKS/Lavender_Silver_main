const express = require('express');
const router = express.Router();
const facebook = require('../controllers/facebook.controller');

router.post('/login', facebook.facebookLogin);
router.post('/signup', facebook.facebookSignup);
router.post('/admin/login', facebook.facebookAdminLogin);

module.exports = router;

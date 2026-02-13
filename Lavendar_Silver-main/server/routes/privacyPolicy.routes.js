const express = require('express');
const router = express.Router();
const privacyPolicyController = require('../controllers/privacyPolicy.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// PUBLIC ROUTES (Frontend)
router.get('/all', privacyPolicyController.getAllPrivacyPolicyData);
router.get('/header', privacyPolicyController.getHeader);
router.get('/sections', privacyPolicyController.getSections);

// ADMIN ROUTES (Protected)
router.post('/header', auth, requireRole('admin'), privacyPolicyController.createHeader);
router.put('/header/:id', auth, requireRole('admin'), privacyPolicyController.updateHeader);
router.post('/sections', auth, requireRole('admin'), privacyPolicyController.createSection);
router.put('/sections/:id', auth, requireRole('admin'), privacyPolicyController.updateSection);

module.exports = router; 
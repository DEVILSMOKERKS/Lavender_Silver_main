const express = require('express');
const router = express.Router();
const termsConditionsController = require('../controllers/termsConditions.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// PUBLIC ROUTES (Frontend)
router.get('/all', termsConditionsController.getAllTermsConditionsData);
router.get('/header', termsConditionsController.getHeader);
router.get('/sections', termsConditionsController.getSections);

// ADMIN ROUTES (Protected)
router.post('/header', auth, requireRole('admin'), termsConditionsController.createHeader);
router.put('/header/:id', auth, requireRole('admin'), termsConditionsController.updateHeader);
router.post('/sections', auth, requireRole('admin'), termsConditionsController.createSection);
router.put('/sections/:id', auth, requireRole('admin'), termsConditionsController.updateSection);

module.exports = router; 
const express = require('express');
const router = express.Router();
const returnPolicyController = require('../controllers/returnPolicy.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// PUBLIC ROUTES (Frontend)
router.get('/all', returnPolicyController.getAllReturnPolicyData);
router.get('/header', returnPolicyController.getHeader);
router.get('/sections', returnPolicyController.getSections);

// ADMIN ROUTES (Protected)
router.post('/header', auth, requireRole('admin'), returnPolicyController.createHeader);
router.put('/header/:id', auth, requireRole('admin'), returnPolicyController.updateHeader);
router.post('/sections', auth, requireRole('admin'), returnPolicyController.createSection);
router.put('/sections/:id', auth, requireRole('admin'), returnPolicyController.updateSection);

module.exports = router; 
const express = require('express');
const router = express.Router();
const shippingPolicyController = require('../controllers/shippingPolicy.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// PUBLIC ROUTES (Frontend)
router.get('/all', shippingPolicyController.getAllShippingPolicyData);
router.get('/header', shippingPolicyController.getHeader);
router.get('/sections', shippingPolicyController.getSections);

// ADMIN ROUTES (Protected)
router.post('/header', auth, requireRole('admin'), shippingPolicyController.createHeader);
router.put('/header/:id', auth, requireRole('admin'), shippingPolicyController.updateHeader);
router.post('/sections', auth, requireRole('admin'), shippingPolicyController.createSection);
router.put('/sections/:id', auth, requireRole('admin'), shippingPolicyController.updateSection);

module.exports = router; 
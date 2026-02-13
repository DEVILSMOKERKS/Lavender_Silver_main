const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faq.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// =======================================
// PUBLIC ROUTES (Frontend)
// =======================================

// Get all FAQ data for frontend
router.get('/all', faqController.getAllFaqData);

// Get individual FAQ sections
router.get('/general-enquiry', faqController.getGeneralEnquiry);
router.get('/placing-an-order', faqController.getPlacingAnOrder);
router.get('/shipping', faqController.getShipping);
router.get('/maintenance', faqController.getMaintenance);

// =======================================
// ADMIN ROUTES (Protected)
// =======================================

// General Enquiry CRUD
router.post('/general-enquiry', auth, requireRole('admin'), faqController.createGeneralEnquiry);
router.put('/general-enquiry/:id', auth, requireRole('admin'), faqController.updateGeneralEnquiry);

// Placing An Order CRUD
router.post('/placing-an-order', auth, requireRole('admin'), faqController.createPlacingAnOrder);
router.put('/placing-an-order/:id', auth, requireRole('admin'), faqController.updatePlacingAnOrder);

// Shipping CRUD
router.post('/shipping', auth, requireRole('admin'), faqController.createShipping);
router.put('/shipping/:id', auth, requireRole('admin'), faqController.updateShipping);

// Maintenance CRUD
router.post('/maintenance', auth, requireRole('admin'), faqController.createMaintenance);
router.put('/maintenance/:id', auth, requireRole('admin'), faqController.updateMaintenance);

module.exports = router; 
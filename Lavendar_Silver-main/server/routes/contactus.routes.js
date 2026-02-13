const express = require('express');
const router = express.Router();
const contactusController = require('../controllers/contactus.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// Public: Submit contact form
router.post('/', contactusController.createContactUs);

// Admin only: Get all contact messages
router.get('/', auth, requireRole('admin'), contactusController.getAllContactUs);

// Admin only: Delete contact message
router.delete('/:id', auth, requireRole('admin'), contactusController.deleteContactUs);

// Admin only: Realign contact_us table IDs
router.post('/realign-ids', auth, requireRole('admin'), contactusController.realignContactUsIds);

module.exports = router;

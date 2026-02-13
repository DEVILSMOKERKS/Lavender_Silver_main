const express = require('express');
const router = express.Router();
const eliteMembersController = require('../controllers/elite_members.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// Public: Subscribe as elite member
router.post('/', eliteMembersController.createEliteMember);

// Public: Send elite member welcome email
router.post('/send-welcome-email', eliteMembersController.sendEliteWelcomeEmail);

// Admin only: Get all elite members
router.get('/', auth, requireRole('admin'), eliteMembersController.getAllEliteMembers);

// Admin only: Delete elite member
router.delete('/:id', auth, requireRole('admin'), eliteMembersController.deleteEliteMember);

// Admin only: Realign elite_members table IDs
router.post('/realign-ids', auth, requireRole('admin'), eliteMembersController.realignEliteMemberIds);

module.exports = router;

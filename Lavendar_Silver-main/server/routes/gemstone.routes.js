const express = require('express');
const router = express.Router();
const gemstoneController = require('../controllers/gemstone.controller');
const { authenticateAdmin } = require('../middlewares/auth');

// Get all gemstones
router.get('/', gemstoneController.getAllGemstones);

// Get gemstone by ID
router.get('/:id', gemstoneController.getGemstoneById);

// Create new gemstone (admin only)
router.post('/', authenticateAdmin, gemstoneController.createGemstone);

// Update gemstone (admin only)
router.put('/:id', authenticateAdmin, gemstoneController.updateGemstone);

// Delete gemstone (admin only)
router.delete('/:id', authenticateAdmin, gemstoneController.deleteGemstone);

module.exports = router; 
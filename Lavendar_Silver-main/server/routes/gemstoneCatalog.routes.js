const express = require('express');
const router = express.Router();
const gemstoneController = require('../controllers/gemstoneCatalog.controller');
const auth = require('../middlewares/auth');

// Public routes (for frontend dropdowns)
router.get('/', gemstoneController.getAllGemstones);
router.get('/type/:type', gemstoneController.getGemstonesByType);
router.get('/:id', gemstoneController.getGemstoneById);

// Protected routes (admin only)
router.post('/', auth, gemstoneController.createGemstone);
router.put('/:id', auth, gemstoneController.updateGemstone);
router.delete('/:id', auth, gemstoneController.deleteGemstone);

module.exports = router;


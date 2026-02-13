const express = require('express');
const router = express.Router();
const facebookPixel = require('../controllers/facebookPixel.controller');
const { authenticateAdmin } = require('../middlewares/auth');


// Get all pixel configurations
router.get('/', authenticateAdmin, facebookPixel.getAllPixelConfigs);

// Get active pixel configuration for frontend
router.get('/active', authenticateAdmin, facebookPixel.getActivePixelConfig);

// Get single pixel configuration
router.get('/:id', authenticateAdmin, facebookPixel.getPixelConfig);

// Add new pixel configuration
router.post('/', authenticateAdmin, facebookPixel.addPixelConfig);

// Update pixel configuration
router.put('/:id', authenticateAdmin, facebookPixel.updatePixelConfig);

// Delete pixel configuration
router.delete('/:id', authenticateAdmin, facebookPixel.deletePixelConfig);

module.exports = router;

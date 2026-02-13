const express = require('express');
const router = express.Router();
const productWeightController = require('../controllers/productWeight.controller');
const { authenticateAdmin } = require('../middlewares/auth');

// Get product weight details
router.get('/:product_id', productWeightController.getProductWeightDetails);

// Create or update product weight details (admin only)
router.post('/:product_id', authenticateAdmin, productWeightController.createOrUpdateProductWeightDetails);

// Delete product weight details (admin only)
router.delete('/:product_id', authenticateAdmin, productWeightController.deleteProductWeightDetails);

// Get product stones
router.get('/:product_id/stones', productWeightController.getProductStones);

// Add product stone (admin only)
router.post('/:product_id/stones', authenticateAdmin, productWeightController.addProductStone);

// Update product stone (admin only)
router.put('/stones/:stone_id', authenticateAdmin, productWeightController.updateProductStone);

// Delete product stone (admin only)
router.delete('/stones/:stone_id', authenticateAdmin, productWeightController.deleteProductStone);

module.exports = router; 
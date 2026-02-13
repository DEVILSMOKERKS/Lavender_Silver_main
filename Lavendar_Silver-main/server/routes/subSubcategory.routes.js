const express = require('express');
const router = express.Router();
const subSubcategoryController = require('../controllers/subSubcategory.controller');
const { authenticateAdmin } = require('../middlewares/auth');

// Get all sub-subcategories
router.get('/', subSubcategoryController.getAllSubSubcategories);

// Get sub-subcategory by ID
router.get('/:id', subSubcategoryController.getSubSubcategoryById);

// Create new sub-subcategory (admin only)
router.post('/', authenticateAdmin, subSubcategoryController.createSubSubcategory);

// Update sub-subcategory (admin only)
router.put('/:id', authenticateAdmin, subSubcategoryController.updateSubSubcategory);

// Delete sub-subcategory (admin only)
router.delete('/:id', authenticateAdmin, subSubcategoryController.deleteSubSubcategory);

module.exports = router; 
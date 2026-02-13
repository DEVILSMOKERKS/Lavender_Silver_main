const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');
const subcategoryController = require('../controllers/subcategory.controller');
const auth = require('../middlewares/auth');

router.post('/', auth, auth.requireRole('admin'), upload.single('image', '/subcategories'), subcategoryController.createSubcategory);
router.get('/', subcategoryController.getAllSubcategories);
router.get('/:id', subcategoryController.getSubcategoryById);
router.get('/category/:categoryId', subcategoryController.getSubcategoriesByCategoryId);
router.put('/:id', auth, auth.requireRole('admin'), upload.single('image', '/subcategories'), subcategoryController.updateSubcategory);
router.delete('/:id', auth, auth.requireRole('admin'), subcategoryController.deleteSubcategory);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');
const categoryController = require('../controllers/category.controller');
const auth = require('../middlewares/auth');

router.post('/', auth, auth.requireRole('admin'), upload.single('image', '/categories'), categoryController.createCategory);
router.get('/hierarchy', categoryController.getCategoryHierarchy);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', auth, auth.requireRole('admin'), upload.single('image', '/categories'), categoryController.updateCategory);
router.delete('/:id', auth, auth.requireRole('admin'), categoryController.deleteCategory);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');
const blogController = require('../controllers/blog.controller');
const auth = require('../middlewares/auth');

router.post('/', auth, auth.requireRole('admin'), upload.single('image', '/blogs'), blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/published', blogController.getPublishedBlogs);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id', blogController.getBlogById);
router.put('/:id', auth, auth.requireRole('admin'), upload.single('image', '/blogs'), blogController.updateBlog);
router.delete('/:id', auth, auth.requireRole('admin'), blogController.deleteBlog);

module.exports = router;
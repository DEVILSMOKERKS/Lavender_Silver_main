const express = require('express');
const router = express.Router();
const shopBannerController = require('../controllers/shopBanner.controller');
const { upload } = require('../middlewares/multer');

// Routes
router.get('/', shopBannerController.getBanners);
router.post('/', shopBannerController.createBanners);
router.put('/', shopBannerController.updateBanners);
router.delete('/', shopBannerController.deleteBanners);
router.post('/upload', upload.single('image', '/shop_banner'), shopBannerController.uploadBannerImage);

module.exports = router; 
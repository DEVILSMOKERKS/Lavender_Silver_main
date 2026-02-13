const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');
const homeBannerController = require('../controllers/home_banner.controller');
const auth = require('../middlewares/auth');



// -----------------------------------------
// ✅ Social Links Routes
// -----------------------------------------
router.post(
  '/social-links',
  auth,
  auth.requireRole('admin'),
  homeBannerController.createSocialLinks
);

router.get(
  '/social-links',
  homeBannerController.getAllSocialLinks
);

router.get(
  '/social-links/:id',
  homeBannerController.getSocialLinkById
);

router.put(
  '/social-links/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.updateSocialLink
);

router.delete(
  '/social-links/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteSocialLink
);

// ✅ Optional: Increment click count when link is clicked
router.post(
  '/social-links/:id/click',
  homeBannerController.incrementClickCount
);




// -----------------------------------------
// ✅ Second Feature Category Routes
// -----------------------------------------
router.post(
  '/second-feature-category',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 10, '/second_feature_cat'),
  homeBannerController.createSecondFeatureCat
);

router.get(
  '/second-feature-category',
  homeBannerController.getAllSecondFeatureCats
);

router.get(
  '/second-feature-category/:id',
  homeBannerController.getSecondFeatureCatById
);

router.put(
  '/second-feature-category/:id',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 1, '/second_feature_cat'),
  homeBannerController.updateSecondFeatureCat
);

router.delete(
  '/second-feature-category/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteSecondFeatureCat
);


// -----------------------------------------
// ✅ Promo Banner Routes
// -----------------------------------------
router.post(
  '/promo-banners',
  auth,
  auth.requireRole('admin'),
  upload.single('image', '/promo-banners'),
  homeBannerController.createPromoBanner
);

router.get(
  '/promo-banners',
  homeBannerController.getAllPromoBanners
);

router.get(
  '/promo-banners/:id',
  homeBannerController.getPromoBannerById
);

router.put(
  '/promo-banners/:id',
  auth,
  auth.requireRole('admin'),
  upload.single('image', "/promo-banners"),
  homeBannerController.updatePromoBanner
);

router.delete(
  '/promo-banners/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deletePromoBanner
);

// -----------------------------------------
// ✅ Wrapped With Love Routes (STATIC PATH)
// -----------------------------------------
router.post(
  '/wrapped-love',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 10, '/wrapped_with_love'),
  homeBannerController.createWrappedWithLove
);

router.get(
  '/wrapped-love',
  homeBannerController.getAllWrappedWithLove
);

router.get(
  '/wrapped-love/:id',
  homeBannerController.getWrappedWithLoveById
);

router.put(
  '/wrapped-love/:id',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 1, '/wrapped_with_love'),
  homeBannerController.updateWrappedWithLove
);

router.delete(
  '/wrapped-love/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteWrappedWithLove
);

// UPDATE: Bulk update wrapped with love positions
router.put(
  '/wrapped-love/positions/update',
  auth,
  auth.requireRole('admin'),
  homeBannerController.updateWrappedWithLovePositions
);

// -----------------------------------------
// ✅ Promo Banner Routes
// -----------------------------------------
router.post(
  '/promo-banners',
  auth,
  auth.requireRole('admin'),
  upload.single('image', '/promo-banners'),
  homeBannerController.createPromoBanner
);

router.get(
  '/promo-banners',
  homeBannerController.getAllPromoBanners
);

router.get(
  '/promo-banners/:id',
  homeBannerController.getPromoBannerById
);

router.put(
  '/promo-banners/:id',
  auth,
  auth.requireRole('admin'),
  upload.single('image', "/promo-banners"),
  homeBannerController.updatePromoBanner
);

router.delete(
  '/promo-banners/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deletePromoBanner
);

// -----------------------------------------
// ✅ Feature Category Routes (STATIC PATH)
// -----------------------------------------

// GET: All categories for dropdown selection
router.get(
  '/categories',
  homeBannerController.getAllCategories
);
router.post(
  '/feature-category',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 10, '/featured-category'),
  homeBannerController.createFeatureImages
);

router.get(
  '/feature-category',
  homeBannerController.getAllFeatureImages
);

router.get(
  '/feature-category/:id',
  homeBannerController.getFeatureImagesById
);

router.put(
  '/feature-category/:id',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 1, '/featured-category'),
  homeBannerController.updateFeatureImages
);

router.delete(
  '/feature-category/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteFeatureImages
);

// UPDATE: Bulk update featured category positions
router.put(
  '/feature-category/positions/update',
  auth,
  auth.requireRole('admin'),
  homeBannerController.updateFeatureCategoryPositions
);

// -----------------------------------------
// ✅ Instagram Images Routes
// -----------------------------------------
router.post(
  '/instagram-images',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 10, '/instagram_images'),
  homeBannerController.createInstaImages
);

router.get(
  '/instagram-images',
  homeBannerController.getAllInstaImages
);

router.get(
  '/instagram-images/:id',
  homeBannerController.getInstaImageById
);

router.put(
  '/instagram-images/:id',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 1, '/instagram_images'),
  homeBannerController.updateInstaImage
);

router.delete(
  '/instagram-images/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteInstaImage
);

// -----------------------------------------
// ✅ Home Banners (STATIC PATH FIRST)
// -----------------------------------------
router.post(
  '/',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 10, '/home_banners'),
  homeBannerController.createBanners
);

router.get(
  '/',
  homeBannerController.getAllBanners
);

// GET: Banners by device type (mobile/desktop/both)
router.get(
  '/device/:device_type',
  homeBannerController.getAllBanners
);

// ✅ Keep dynamic `:id` routes LAST to avoid conflict
router.get(
  '/:id',
  homeBannerController.getBannerById
);

router.put(
  '/:id',
  auth,
  auth.requireRole('admin'),
  upload.array('images', 1, '/home_banners'),
  homeBannerController.updateBanner
);

router.delete(
  '/:id',
  auth,
  auth.requireRole('admin'),
  homeBannerController.deleteBanner
);

// UPDATE: Bulk update banner positions
router.put(
  '/positions/update',
  auth,
  auth.requireRole('admin'),
  homeBannerController.updateBannerPositions
);



module.exports = router;

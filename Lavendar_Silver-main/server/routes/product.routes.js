const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');
const { videoUpload } = require('../controllers/product.controller');

// =======================================
// PRODUCT ROUTES
// =======================================

// Public routes (no authentication required)
router.get('/products', productController.getAllProducts);
router.get('/products/latest-luxury', productController.getLatestLuxuryProducts);
router.get('/products/latest-signature', productController.getLatestSignatureProduct);
router.get('/products/new-in', productController.getNewInProducts);
router.get('/products/bestseller', productController.getBestsellerProducts);
router.get('/products/stats/overview', productController.getProductStats);
router.get('/products/generate-tag', productController.generateTagNumber);
router.get('/products/generate-sku', productController.generateSKUEndpoint);
router.get('/products/slug/:slug', productController.getProductBySlug);
router.get('/products/:id', productController.getProductById);

// Utility routes
router.post('/products/update-slugs', auth, productController.updateExistingProductSlugs);

// Add latest signature product route

// Product CRUD operations
router.post('/products', auth, productController.createProduct);
router.post('/products/bulk', auth, productController.bulkUploadProducts);
router.put('/products/:id', auth, productController.updateProduct);
router.delete('/products/:id', auth, productController.deleteProduct);

// Image management
router.post('/products/:product_id/images', auth, upload.array('images', 10, '/products'), productController.uploadProductImages);
router.post('/admin/products/:product_id/images', auth, upload.array('images', 10, '/products'), productController.uploadProductImages);
router.delete('/products/images/:image_id', auth, productController.deleteProductImage);

// Video management
router.post('/products/:product_id/videos', auth, videoUpload.array('videos', 5), productController.uploadProductVideos);
router.post('/admin/products/:product_id/videos', auth, videoUpload.array('videos', 5), productController.uploadProductVideos);
router.get('/products/:product_id/videos', productController.getProductVideos);
router.delete('/products/videos/:video_id', auth, productController.deleteProductVideo);

// Bulk operations
router.put('/products/bulk/update', auth, productController.bulkUpdateProducts);
router.delete('/products/bulk/delete', auth, productController.bulkDeleteProducts);
router.post('/admin/products/bulk-upload', auth, productController.bulkUploadProducts);
router.post('/products/bulk', auth, productController.bulkUploadProducts); // Alias for compatibility
router.post('/products/check-tag-numbers', auth, productController.checkTagNumbers);

// =======================================
// PRODUCT CUSTOMIZATION ROUTES
// =======================================

// Get product metal types
router.get('/products/:product_id/metal-types', productController.getProductMetalTypes);

// Get product diamond qualities
router.get('/products/:product_id/diamond-qualities', productController.getProductDiamondQualities);

// Get product size options
router.get('/products/:product_id/size-options', productController.getProductSizeOptions);

// Get product weight options
router.get('/products/:product_id/weight-options', productController.getProductWeightOptions);



// =======================================
// PRODUCT REVIEWS ROUTES
// =======================================

// Get product reviews
router.get('/products/:product_id/reviews', productController.getProductReviews);

// Create product review
router.post('/products/:product_id/reviews', auth, productController.reviewUpload.single('image'), productController.createProductReview);

// Delete product review
router.delete('/reviews/:review_id', auth, productController.deleteProductReview);

// Price breakup functionality removed



// PRODUCT CERTIFICATES ROUTES
const { uploadCertificateFiles } = productController;
router.post('/products/:product_id/certificates', auth, uploadCertificateFiles, productController.createProductCertificate);
router.get('/products/:product_id/certificates', productController.getProductCertificates);
router.get('/user/certificates', auth, productController.getUserProductCertificates); // Get certificates for user's ordered products
router.get('/certificates', productController.getProductCertificates);
router.put('/certificates/:id', auth, uploadCertificateFiles, productController.updateProductCertificate);
router.delete('/certificates/:id', auth, productController.deleteProductCertificate);

// PRODUCT FEATURES ROUTES
router.get('/products/:product_id/features', productController.getProductFeatures);
router.post('/products/:product_id/features', auth, productController.createProductFeature);
router.put('/product-features/:id', auth, productController.updateProductFeature);
router.delete('/product-features/:id', auth, productController.deleteProductFeature);

// =======================================
// REVIEW MANAGEMENT ROUTES
// =======================================

// =======================================
// EDIT PRODUCT POPUP SECTION ROUTES
// =======================================

// Image Section Routes
router.put('/admin/products/:product_id/images/reorder', auth, productController.reorderProductImages);
router.put('/admin/products/:product_id/images/update', auth, productController.updateProductImages);
router.delete('/admin/products/:product_id/images/:image_id', auth, productController.deleteProductImage);

// Video Section Routes
router.put('/admin/products/:product_id/videos/reorder', auth, productController.reorderProductVideos);
router.put('/admin/products/:product_id/videos/update', auth, productController.updateProductVideos);
router.post('/admin/products/:product_id/videos', auth, videoUpload.array('videos', 5), productController.uploadProductVideos);
router.delete('/admin/products/:product_id/videos/:video_id', auth, productController.deleteProductVideo);

// Product Data Section Routes
router.get('/admin/products/:product_id/product-data', auth, productController.getProductData);
router.put('/admin/products/:product_id/product-data', auth, productController.updateProductData);

// Less Weight Items Routes - Now handled by main updateProduct route

// Media Compression Route
router.post('/admin/products/:product_id/compress-media', auth, productController.compressExistingMedia);

// Category Section Routes
router.put('/admin/products/:product_id/categories', auth, productController.updateProductCategories);

// Certification Section Routes
router.put('/admin/products/:product_id/certification', auth, productController.updateProductCertification);

// Admin Certificate Routes
router.post('/admin/products/:product_id/certificates', auth, uploadCertificateFiles, productController.createProductCertificate);
router.get('/admin/products/:product_id/certificates', auth, productController.getProductCertificates);
router.put('/admin/products/:product_id/certificates/:certificate_id', auth, uploadCertificateFiles, productController.updateProductCertificate);
router.delete('/admin/products/:product_id/certificates/:certificate_id', auth, productController.deleteProductCertificate);
// =======================================
// REVIEW MANAGEMENT ROUTES
// =======================================

// Get all reviews (for admin)
router.get('/admin/reviews', productController.getAllReviews);

// Send message to reviewer
router.post('/reviews/:review_id/message', auth, productController.sendMessageToReviewer);

// Flag/Unflag review
router.put('/reviews/:review_id/flag', auth, productController.flagReview);
// =======================================
// PRODUCT COMPARISON ROUTES
// =======================================

// Get similar products for comparison
router.get('/products/:product_id/similar-for-comparison', productController.getSimilarProductsForComparison);

// Get detailed comparison between two products
router.get('/products/compare/:product1_id/:product2_id', productController.getProductComparison);

// Add product restock route for wishlist monitoring
router.post('/admin/products/:product_id/restock', auth, productController.restockProduct);

// =======================================
// PRODUCT SECTIONS ROUTES
// =======================================

// Get products by section (public)
router.get('/products/section/:section_name', productController.getProductsBySection);

// Get all product sections (admin)
router.get('/admin/product-sections', auth, productController.getAllProductSections);

// Add product to section (admin)
router.post('/admin/product-sections', auth, productController.addProductToSection);

// Remove product from section (admin)
router.delete('/admin/product-sections/:product_id/:section_name', auth, productController.removeProductFromSection);

// Update product section order (admin)
router.put('/admin/product-sections/:section_name/order', auth, productController.updateProductSectionOrder);

// Get available products for section (admin)
router.get('/admin/product-sections/:section_name/available-products', auth, productController.getAvailableProductsForSection);

// =======================================
// PRODUCT BANNER CMS ROUTES
// =======================================

// Public route to get banner by device type
router.get('/product-banner', productController.getProductBanner);

// Admin routes for banner management
router.get('/admin/product-banners', auth, productController.getAllProductBanners);
router.post('/admin/product-banner', auth, upload.single('background_image', '/product_banner'), productController.createOrUpdateBanner);

// =======================================
// ADDPRODUCTPOPUP.JSX ROUTES
// =======================================

// Create product with full AddProductPopup data
router.post('/admin/products/full', auth, productController.createProductWithFullData);

// Get product with full AddProductPopup data
router.get('/admin/products/:id/full', auth, productController.getProductWithFullData);

// Get categories hierarchy for AddProductPopup
router.get('/admin/categories/hierarchy', auth, productController.getCategoriesHierarchy);

// Get metal types for product options
router.get('/admin/metal-types', auth, productController.getProductMetalTypes);

module.exports = router;
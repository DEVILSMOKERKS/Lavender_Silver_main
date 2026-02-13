const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/about.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');

// =======================================
// PUBLIC ROUTES (Frontend)
// =======================================

// Get all about us data for frontend
router.get('/all', aboutController.getAllAboutUsData);

// Get individual sections
router.get('/section', aboutController.getAboutUsSection);
router.get('/mission-vision', aboutController.getMissionVision);
router.get('/journey', aboutController.getJourneyTimeline);
router.get('/craftsmanship', aboutController.getCraftsmanshipQuality);
router.get('/what-makes-us', aboutController.getWhatMakesUs);
router.get('/who-we-are', aboutController.getWhoWeAre);

// =======================================
// ADMIN ROUTES (Protected)
// =======================================

// About Us Section CRUD (image_url)
router.post('/section', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.createAboutUsSection);
router.put('/section/:id', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.updateAboutUsSection);

// Mission Vision CRUD (icon_url)
router.post('/mission-vision', auth, requireRole('admin'), upload.single('icon_url', '/aboutus'), aboutController.createMissionVision);
router.put('/mission-vision/:id', auth, requireRole('admin'), upload.single('icon_url', '/aboutus'), aboutController.updateMissionVision);

// Journey Timeline CRUD (image_url)
router.post('/journey', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.createJourneyTimeline);
router.put('/journey/:id', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.updateJourneyTimeline);

// Craftsmanship Quality CRUD (card1_icon_url, card2_icon_url, card3_icon_url)
router.post('/craftsmanship', auth, requireRole('admin'), upload.array('images', 3, '/aboutus'), aboutController.createCraftsmanshipQuality);
router.put('/craftsmanship/:id', auth, requireRole('admin'), upload.array('images', 3, '/aboutus'), aboutController.updateCraftsmanshipQuality);

// What Makes Us CRUD (background_image, side_image)
router.post('/what-makes-us', auth, requireRole('admin'), upload.array('images', 2, '/aboutus'), aboutController.createWhatMakesUs);
router.put('/what-makes-us/:id', auth, requireRole('admin'), upload.array('images', 2, '/aboutus'), aboutController.updateWhatMakesUs);

// Who We Are CRUD (image_url)
router.post('/who-we-are', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.createWhoWeAre);
router.put('/who-we-are/:id', auth, requireRole('admin'), upload.single('image_url', '/aboutus'), aboutController.updateWhoWeAre);

module.exports = router; 
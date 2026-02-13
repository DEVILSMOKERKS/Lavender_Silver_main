const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import controllers
const {
    createCustomJewelryRequest,
    getAllCustomJewelryRequests,
    getCustomJewelryRequestById,
    updateCustomJewelryRequestStatus,
    getUserCustomJewelryRequests,
    getUserCustomJewelryRequestsFromToken,
    getCustomJewelryStats,
    deleteCustomJewelryRequest,
    deleteCustomJewelryRequestAdmin
} = require('../controllers/customJewelry.controller');

// Import middleware
const authMiddleware = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/custom-jewelry';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (increased from 5MB)
        files: 5 // Maximum 5 files
    },
    fileFilter: function (req, file, cb) {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum file size is 10MB.'
            });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 5 files allowed.'
            });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field. Please use "referenceImages" field name.'
            });
        }
    }
    next(err);
};

// Public routes (no authentication required)
router.post('/create', upload.array('referenceImages', 5), handleMulterError, createCustomJewelryRequest);

// Authenticated user routes
router.post('/create-auth', authMiddleware, upload.array('referenceImages', 5), handleMulterError, createCustomJewelryRequest);

// User routes (authentication required)
router.get('/user/:userId', authMiddleware, getUserCustomJewelryRequests);
router.get('/user-requests', authMiddleware, getUserCustomJewelryRequestsFromToken);
router.get('/request/:id', authMiddleware, getCustomJewelryRequestById);
router.delete('/request/:id', authMiddleware, deleteCustomJewelryRequest);

// Admin routes (admin authentication required)
router.get('/admin/all', authMiddleware, requireRole('admin'), getAllCustomJewelryRequests);
router.get('/admin/stats', authMiddleware, requireRole('admin'), getCustomJewelryStats);
router.put('/admin/request/:id/status', authMiddleware, requireRole('admin'), updateCustomJewelryRequestStatus);
router.delete('/admin/request/:id', authMiddleware, requireRole('admin'), deleteCustomJewelryRequestAdmin);

module.exports = router; 
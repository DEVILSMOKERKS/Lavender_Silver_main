const express = require('express');
const router = express.Router();
const emailAutomationController = require('../controllers/emailAutomation.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// ========================================
// EMAIL CAMPAIGNS ROUTES (Admin Only)
// ========================================

// Create new campaign
router.post('/campaigns', auth, requireRole('admin'), emailAutomationController.createCampaign);

// Get all campaigns
router.get('/campaigns', auth, requireRole('admin'), emailAutomationController.getAllCampaigns);

// Update campaign status
router.patch('/campaigns/:id/status', auth, requireRole('admin'), emailAutomationController.updateCampaignStatus);

// Delete campaign
router.delete('/campaigns/:id', auth, requireRole('admin'), emailAutomationController.deleteCampaign);

// ========================================
// EMAIL TEMPLATES ROUTES (Admin Only)
// ========================================

// Create new template
router.post('/templates', auth, requireRole('admin'), emailAutomationController.createTemplate);

// Get all templates
router.get('/templates', auth, requireRole('admin'), emailAutomationController.getAllTemplates);

// Get template by ID
router.get('/templates/:id', auth, requireRole('admin'), emailAutomationController.getTemplateById);

// ========================================
// EMAIL STATISTICS ROUTES (Admin Only)
// ========================================

// Get email automation statistics
router.get('/stats', auth, requireRole('admin'), emailAutomationController.getEmailStats);

// ========================================
// EMAIL SUBSCRIBERS ROUTES
// ========================================

// Add subscriber (Public)
router.post('/subscribers', emailAutomationController.addSubscriber);

// Unsubscribe (Public)
router.post('/unsubscribe/:email', emailAutomationController.unsubscribeEmail);

// Get all subscribers (Admin Only)
router.get('/subscribers', auth, requireRole('admin'), emailAutomationController.getAllSubscribers);

// ========================================
// EMAIL AUTOMATION TRIGGERS (Internal)
// ========================================

// Trigger welcome email (Internal use)
router.post('/trigger/welcome', auth, requireRole('admin'), async (req, res) => {
    const { userId, userEmail, userName } = req.body;
    if (!userId || !userEmail || !userName) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    try {
        const result = await emailAutomationController.triggerWelcomeEmail(userId, userEmail, userName);
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Trigger abandoned cart email (Internal use)
router.post('/trigger/abandoned-cart', auth, requireRole('admin'), async (req, res) => {
    const { userId, userEmail, userName, cartItems } = req.body;
    if (!userId || !userEmail || !userName) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    try {
        const result = await emailAutomationController.triggerAbandonedCartEmail(userId, userEmail, userName, cartItems);
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Trigger order confirmation email (Internal use)
router.post('/trigger/order-confirmation', auth, requireRole('admin'), async (req, res) => {
    const { userId, userEmail, userName, orderDetails } = req.body;
    if (!userId || !userEmail || !userName || !orderDetails) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    try {
        const result = await emailAutomationController.triggerOrderConfirmationEmail(userId, userEmail, userName, orderDetails);
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Trigger promotional email (Internal use)
router.post('/trigger/promotional', auth, requireRole('admin'), async (req, res) => {
    const { productData, couponData } = req.body;
    
    try {
        const result = await emailAutomationController.triggerPromotionalEmail(productData, couponData);
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Trigger Product Launch email (Internal use)
router.post('/trigger/product-launch', auth, requireRole('admin'), async (req, res) => {
    const { productData } = req.body;
    
    if (!productData || !productData.name) {
        return res.status(400).json({ success: false, message: 'Product data with name is required.' });
    }
    
    try {
        const result = await emailAutomationController.triggerProductLaunchEmail(productData);
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Check abandoned carts (Internal use - can be called by cron job)
router.post('/check-abandoned-carts', auth, requireRole('admin'), async (req, res) => {
    try {
        const result = await emailAutomationController.checkAbandonedCarts();
        return res.json({ success: true, result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Log user activity (Internal use)
router.post('/log-activity', auth, async (req, res) => {
    const { userId, activityType, activityData } = req.body;
    if (!userId || !activityType) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    try {
        await emailAutomationController.logUserActivity(userId, activityType, activityData);
        return res.json({ success: true, message: 'Activity logged successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ========================================
// MANUAL EMAIL SENDING ROUTES (Admin Only)
// ========================================

// Get users for manual email sending
router.get('/manual/users', auth, requireRole('admin'), emailAutomationController.getUsersForManualEmail);

// Get products for manual email sending
router.get('/manual/products', auth, requireRole('admin'), emailAutomationController.getProductsForManualEmail);

// Get offers/coupons for manual email sending
router.get('/manual/offers', auth, requireRole('admin'), emailAutomationController.getOffersForManualEmail);

// Get abandoned cart users for manual email
router.get('/manual/abandoned-carts', auth, requireRole('admin'), emailAutomationController.getAbandonedCartUsers);

// Send manual email to selected users
router.post('/manual/send', auth, requireRole('admin'), emailAutomationController.sendManualEmail);

module.exports = router; 
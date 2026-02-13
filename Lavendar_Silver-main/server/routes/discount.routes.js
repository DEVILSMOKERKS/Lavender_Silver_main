const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

router.post('/', auth, requireRole('admin'), discountController.createDiscount);
router.get('/', discountController.getAllDiscounts);
router.get('/frontend', discountController.getFrontendDiscounts);
router.get('/email', discountController.getEmailDiscounts);
router.get('/hidden', discountController.getHiddenDiscounts);

// USER COUPONS CRUD
router.post('/user-coupons', auth, discountController.createUserCoupon);
router.get('/user-coupons', discountController.getAllUserCoupons);
router.get('/user-coupons/user/:user_id', discountController.getUserCouponsByUser);
router.get('/user-coupons/status/:status', discountController.getUserCouponsByStatus);
router.put('/user-coupons/:id', auth, discountController.updateUserCoupon);
router.delete('/user-coupons/:id', auth, discountController.deleteUserCoupon);

// Get discount by ID
router.get('/:id', discountController.getDiscountById);
router.put('/:id', auth, requireRole('admin'), discountController.updateDiscount);
router.delete('/:id', auth, requireRole('admin'), discountController.deleteDiscount);

module.exports = router;
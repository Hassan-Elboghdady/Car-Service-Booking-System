const express = require('express');
const { getCoupons, createCoupon, removeCoupon } = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

// Admin: Manage coupons
router.get('/', getCoupons);
router.post('/', createCoupon);
router.delete('/:id', removeCoupon);

module.exports = router;

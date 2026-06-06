const Coupon = require('../models/Coupon');

// GET /api/coupons — get all coupons (admin only)
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Coupons fetched.',
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons — create a new coupon (admin only)
const createCoupon = async (req, res, next) => {
  try {
    const { code, discount, minOrder, exp } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Coupon code "${code}" already exists!` });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discount,
      minOrder: minOrder || 0,
      exp: exp || '',
      active: true,
    });

    res.status(201).json({
      message: 'Coupon created.',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id — remove a coupon (admin only)
const removeCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found.' });
    }
    res.status(200).json({ message: 'Coupon removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCoupons, createCoupon, removeCoupon };

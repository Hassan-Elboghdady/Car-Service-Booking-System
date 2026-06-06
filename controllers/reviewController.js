const { validationResult } = require('express-validator');
const Review = require('../models/Review');

const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { bookingId, rating, text } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      bookingId,
      rating,
      text,
      status: 'pending',
    });
    res.status(201).json({ message: 'Review submitted', data: review });
  } catch(e) { next(e); }
};

const getApprovedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(200).json({ message: 'Approved reviews', data: reviews });
  } catch(e) { next(e); }
};

const getAllReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: 'All reviews',
      data: reviews,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch(e) { next(e); }
};

const updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ message: 'Status updated', data: review });
  } catch(e) { next(e); }
};

const deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Review deleted' });
  } catch(e) { next(e); }
};

module.exports = { createReview, getApprovedReviews, getAllReviews, updateReviewStatus, deleteReview };

const Review = require('../models/Review');

const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, text } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      bookingId,
      rating,
      text,
      status: 'pending'
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
    const reviews = await Review.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.status(200).json({ message: 'All reviews', data: reviews });
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

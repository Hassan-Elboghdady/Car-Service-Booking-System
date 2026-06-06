const express = require('express');
const { body } = require('express-validator');
const { createReview, getApprovedReviews, getAllReviews, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/approved', getApprovedReviews);
router.post(
  '/',
  protect,
  [
    body('bookingId').trim().notEmpty().withMessage('Booking ID is required.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
    body('text').trim().notEmpty().withMessage('Review text is required.'),
  ],
  createReview
);
router.get('/all', protect, authorize('admin'), getAllReviews);
router.put(
  '/:id/status',
  protect,
  authorize('admin'),
  [body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid review status.')],
  updateReviewStatus
);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;

const express = require('express');
const { createReview, getApprovedReviews, getAllReviews, updateReviewStatus, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/approved', getApprovedReviews);
router.post('/', protect, createReview);
router.get('/all', protect, authorize('admin'), getAllReviews);
router.put('/:id/status', protect, authorize('admin'), updateReviewStatus);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;

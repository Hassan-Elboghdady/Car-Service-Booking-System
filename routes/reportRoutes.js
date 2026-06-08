const express = require('express');
const { createReport, getReports, getReportsByUser, replyToReport, updateReportStatus, deleteReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, authorize('admin'), getReports);
router.get('/user/:userId', protect, getReportsByUser);
router.put('/:id/reply', protect, replyToReport);
router.put('/:id/status', protect, authorize('admin'), updateReportStatus);
router.delete('/:id', protect, authorize('admin'), deleteReport);

module.exports = router;

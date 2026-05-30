const express = require('express');
const { submitIssue, getIssues } = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitIssue);
router.get('/', protect, getIssues);

module.exports = router;

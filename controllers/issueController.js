const StaffIssue = require('../models/StaffIssue');

const submitIssue = async (req, res, next) => {
  try {
    const { staffId, bookingId, type, severity, desc } = req.body;
    const actualStaffId = req.user ? req.user._id : staffId;

    const issue = await StaffIssue.create({
      staffId: actualStaffId, bookingId, type, severity, desc
    });

    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

// GET /api/issues - Get staff issues for the logged-in staff
const getIssues = async (req, res, next) => {
  try {
    const issues = await StaffIssue.find({ staffId: req.user._id }).sort({ createdAt: -1 });
    const formattedIssues = issues.map(i => ({
      ...i.toObject(),
      id: i._id.toString()
    }));
    res.status(200).json(formattedIssues);
  } catch (error) {
    next(error);
  }
};

module.exports = { submitIssue, getIssues };

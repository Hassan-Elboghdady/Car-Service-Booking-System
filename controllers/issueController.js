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
    const issues = await StaffIssue.find({ staffId: req.user._id })
      .populate('staffId', 'firstName lastName email staffRole')
      .sort({ createdAt: -1 });
    const formattedIssues = issues.map(i => ({
      ...i.toObject(),
      id: i._id.toString()
    }));
    res.status(200).json(formattedIssues);
  } catch (error) {
    next(error);
  }
};

// GET /api/issues/all - Get all staff issues (admin only)
const getAllIssues = async (req, res, next) => {
  try {
    const issues = await StaffIssue.find()
      .populate('staffId', 'firstName lastName email staffRole')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
};

// PUT /api/issues/:id/reply - Reply to staff issue (admin/staff)
const replyToIssue = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const issue = await StaffIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });

    // Permissions: Admin or the staff owner of the issue
    const isAdmin = req.user.role === 'admin';
    const isOwner = issue.staffId.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (reply === undefined || reply === '') {
      issue.adminReply = '';
      issue.replies = [];
      issue.status = 'pending';
      issue.repliedAt = null;
    } else {
      const replyPayload = {
        senderRole: req.user.role,
        senderName: `${req.user.firstName} ${req.user.lastName}`.trim() || 'Staff',
        senderId: req.user._id,
        text: reply,
        createdAt: new Date()
      };
      issue.replies.push(replyPayload);
      issue.adminReply = reply;
      if (isAdmin) {
        issue.status = 'resolved';
        issue.repliedAt = new Date();
      } else {
        issue.status = 'in_progress';
      }
    }

    await issue.save();
    
    // populate staffId details for the response
    const populated = await StaffIssue.findById(issue._id).populate('staffId', 'firstName lastName email staffRole');
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/issues/:id/status - Update staff issue status (admin only)
const updateIssueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const issue = await StaffIssue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('staffId', 'firstName lastName email staffRole');
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitIssue, getIssues, getAllIssues, replyToIssue, updateIssueStatus };

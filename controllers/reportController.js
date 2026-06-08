const CustomerReport = require('../models/CustomerReport');

const createReport = async (req, res, next) => {
  try {
    const { bookingId, type, desc, subject, category } = req.body;
    
    const finalCategory = category || type;
    const finalSubject = subject || `Issue with Booking #${bookingId ? bookingId.slice(-6) : 'unknown'}`;
    const customerName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Customer';
    const email = req.user.email;

    if (!bookingId || !finalCategory || !desc || !customerName || !email || !finalSubject) {
      return res.status(400).json({ message: 'All fields (bookingId, category, subject, description, name, email) are required.' });
    }

    const report = await CustomerReport.create({
      userId: req.user._id,
      bookingId,
      customerName,
      email,
      subject: finalSubject,
      category: finalCategory,
      desc,
      status: 'pending'
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await CustomerReport.find()
      .populate('userId', 'firstName lastName email')
      .populate('bookingId', 'serviceId date time status')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const getReportsByUser = async (req, res, next) => {
  try {
    const reports = await CustomerReport.find({ userId: req.params.userId })
      .populate('bookingId', 'serviceId date time status')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const replyToReport = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const report = await CustomerReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    // Permissions: Admin or the owner of the report
    const isAdmin = req.user.role === 'admin';
    const isOwner = report.userId.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (reply === undefined || reply === '') {
      report.adminReply = '';
      report.replies = [];
      report.status = 'pending';
      report.repliedAt = null;
    } else {
      const replyPayload = {
        senderRole: req.user.role,
        senderName: `${req.user.firstName} ${req.user.lastName}`.trim() || 'User',
        senderId: req.user._id,
        text: reply,
        createdAt: new Date()
      };
      report.replies.push(replyPayload);
      report.adminReply = reply;
      if (isAdmin) {
        report.status = 'resolved';
        report.repliedAt = new Date();
      } else {
        report.status = 'in_progress';
      }
    }

    await report.save();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const report = await CustomerReport.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const report = await CustomerReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.status(200).json({ success: true, message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getReports, getReportsByUser, replyToReport, updateReportStatus, deleteReport };

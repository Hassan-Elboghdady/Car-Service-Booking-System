const { validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact - Submit a contact message
const submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, phone, subject, msg } = req.body;
    const message = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      msg,
      userId: req.user?._id || null,
      replies: [],
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact - Get contact messages (Admin only typically, but we will make it simple for now)
const getContacts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const total = await ContactMessage.countDocuments();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      data: messages,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact/user/:userId - Get messages for a specific user
const getContactsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await ContactMessage.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// POST /api/contact/:id/reply - Save a reply to a contact message
const replyToContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply, text, senderRole, senderName, senderId } = req.body;
    const messageText = reply || text;

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    const replyPayload = {
      senderRole: senderRole || (req.user?.role || 'customer'),
      senderName: senderName || `${req.user?.firstName || 'Guest'} ${req.user?.lastName || ''}`.trim() || 'Guest',
      senderId: req.user?._id || senderId || null,
      text: messageText,
      createdAt: new Date(),
    };

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      {
        $push: { replies: replyPayload },
        adminReply: messageText,
        status: 'replied',
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/contact/:id/status - Update the status of a contact message
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const update = { status };
    if (status === 'unread') {
      update.adminReply = '';
      update.replies = [];
    }
    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getContacts, getContactsByUser, replyToContact, updateStatus };
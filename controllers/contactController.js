const ContactMessage = require('../models/ContactMessage');

// POST /api/contact - Submit a contact message
const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, msg, userId } = req.body;
    
    const message = await ContactMessage.create({
      name, email, phone, subject, msg, userId
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// GET /api/contact - Get contact messages (Admin only typically, but we will make it simple for now)
const getContacts = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// GET /api/contact/user/:userId - Get contact messages for a specific user
const getContactsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const messages = await ContactMessage.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

// POST /api/contact/:id/reply - Admin reply to a contact message
const replyToContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const updated = await ContactMessage.findByIdAndUpdate(id, { adminReply: reply, status: 'replied' }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Message not found' });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/contact/:id/status - Update message status (e.g., read/unread)
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Message not found' });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getContacts, getContactsByUser, replyToContact, updateStatus };
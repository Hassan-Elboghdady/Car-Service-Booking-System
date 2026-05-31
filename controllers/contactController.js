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

module.exports = { submitContact, getContacts };
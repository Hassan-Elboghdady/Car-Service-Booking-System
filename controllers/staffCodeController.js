const StaffCode = require('../models/StaffCode');

// POST /api/staff-codes — generate a new staff code (admin only)
const generateCode = async (req, res, next) => {
  try {
    const codeStr = 'STAFF-' + Date.now().toString(36).toUpperCase();
    
    const staffCode = await StaffCode.create({
      code: codeStr,
      createdBy: req.user._id,
      active: true,
      usedBy: null,
    });

    res.status(201).json({
      message: 'Staff code generated.',
      data: staffCode,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/staff-codes — get all staff codes (admin only)
const getCodes = async (req, res, next) => {
  try {
    const codes = await StaffCode.find().populate('usedBy', 'firstName lastName').sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Staff codes fetched.',
      count: codes.length,
      data: codes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/staff-codes/validate/:code — validate a staff code (public)
const validateCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const staffCode = await StaffCode.findOne({ code, active: true, usedBy: null });
    
    if (!staffCode) {
      return res.status(404).json({ message: 'Invalid or expired staff code.', valid: false });
    }

    res.status(200).json({ message: 'Staff code is valid.', valid: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateCode, getCodes, validateCode };

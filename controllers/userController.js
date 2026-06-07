const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const StaffCode = require('../models/StaffCode');

// Helper: generate JWT token.
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d',
  });
};

// POST /api/users/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password, role, staffCode, staffRole, userType } = req.body;

    // Check duplicate email.
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Check duplicate phone.
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered to another account.' });
    }

    // Validate Staff Code if provided
    let validStaffCode = null;
    if (staffCode) {
      validStaffCode = await StaffCode.findOne({ code: staffCode.toUpperCase(), active: true, usedBy: null });
      if (!validStaffCode) {
        return res.status(400).json({ message: 'Invalid or already used staff code.' });
      }
    }

    // Hash password.
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      phoneNumber: phone,
      password: hashedPassword,
      role: role || 'customer',
      staffCode: staffCode || '',
      staffRole: staffRole || '',
      userType: userType || '',
      points: 0,
      profileCompleted: (role || 'customer') !== 'customer',
    });

    // Mark staff code as used
    if (validStaffCode) {
      validStaffCode.active = false;
      validStaffCode.usedBy = user._id;
      await validStaffCode.save();
    }

    const token = generateToken(user._id, user.role);

    // Set httpOnly cookie.
    res.cookie('as_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password, staffCode } = req.body;

    let user;

    if (staffCode) {
      // Staff login by code.
      user = await User.findOne({
        staffCode: staffCode.toUpperCase(),
        role: { $in: ['staff', 'admin'] },
      });
    } else {
      // Normal login by email.
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id, user.role);

    res.cookie('as_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      message: `Welcome back, ${user.firstName}!`,
      token,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/logout
const logout = async (req, res, next) => {
  try {
    res.clearCookie('as_token');
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'Profile fetched.', data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const allowedFields = ['firstName', 'lastName', 'phone'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If password change requested.
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      const user = await User.findById(req.user._id);
      const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      updates.password = await bcrypt.hash(req.body.newPassword, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({ message: 'Profile updated.', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/profile/image
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const imagePath = '/public/images/uploads/' + req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imagePath },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile image uploaded successfully.',
      data: { profileImage: imagePath, user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/top-customers — admin only
const getTopCustomers = async (req, res, next) => {
  try {
    // Fetch all customers from DB
    const customers = await User.find({ role: 'customer' }).select('-password').lean();

    // Fetch all bookings
    const bookings = await Booking.find().lean();

    // Aggregate per customer — include all non-cancelled bookings in spent
    const custData = customers.map(u => {
      const userIdStr = u._id.toString();
      const userBookings = bookings.filter(b => b.userId && b.userId.toString() === userIdStr);
      const spent = userBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
      return {
        id: userIdStr,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        points: u.points || 0,
        bkCount: userBookings.length,
        spent,
      };
    });

    // Sort by spent desc, then bookings count, then points
    const sorted = custData.sort((a, b) => b.spent - a.spent || b.bkCount - a.bkCount || b.points - a.points);
    const top5 = sorted.slice(0, 5);

    res.status(200).json({ message: 'Top customers fetched.', data: top5 });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/staff — admin only
const getAllStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-password').lean();
    res.status(200).json({ message: 'Staff fetched.', data: staff });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/staff/:id — admin only
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(400).json({ message: 'User is not a staff member.' });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'Staff member removed.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/staff/:id/role — admin only
const updateStaffRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffRole } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { staffRole },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    
    res.status(200).json({ message: 'Staff role updated.', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, uploadProfileImage, getTopCustomers, getAllStaff, deleteStaff, updateStaffRole };

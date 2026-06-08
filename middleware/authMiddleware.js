const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — verify JWT token from header, cookie, or session.
const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback: check cookie.
    if (!token && req.cookies && req.cookies.as_token) {
      token = req.cookies.as_token;
    }

    let decoded = null;
    if (token) {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } else if (req.session && req.session.userId) {
      // Legacy session fallback (email/password session)
      decoded = {
        id: req.session.userId,
        role: req.session.userRole,
      };
    } else if (req.session && req.session.passport && req.session.passport.user) {
      // Passport/OAuth session fallback (Google, Facebook)
      decoded = { id: req.session.passport.user };
    }

    if (!decoded) {
      return res.status(401).json({ message: 'Not authenticated. Please login.' });
    }

    // 4. Find user in database.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    next(error);
  }
};

// Authorize specific roles.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Require staff to have an assigned role before carrying out actions.
const requireStaffRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'staff' && !req.user.isRoleAssigned) {
    return res.status(403).json({ message: 'No role assigned. Please contact your admin.' });
  }
  next();
};

module.exports = { protect, authorize, requireStaffRole };

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Redirect to Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Handle Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) {
      return res.redirect('/login');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('as_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (req.user.role === 'customer' && !req.user.profileCompleted) {
      return res.redirect('/complete-profile');
    }

    res.redirect('/');
  }
);

// Redirect to Facebook OAuth
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
  })
);

// Handle Facebook OAuth callback
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) {
      return res.redirect('/login');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('as_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (req.user.role === 'customer' && !req.user.profileCompleted) {
      return res.redirect('/complete-profile');
    }

    res.redirect('/');
  }
);

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('as_token');
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/login');
  });
});

module.exports = router;

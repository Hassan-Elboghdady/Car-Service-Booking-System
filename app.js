const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const issueRoutes = require('./routes/issueRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const brandRoutes = require('./routes/brandRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const staffCodeRoutes = require('./routes/staffCodeRoutes');
const couponRoutes = require('./routes/couponRoutes');
const authRoutes = require('./routes/authRoutes');
const isAuthenticated = require('./middleware/isAuthenticated');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const viewsDir = path.join(__dirname, 'views');

app.set('view engine', 'ejs');
app.set('views', viewsDir);

const availableViews = new Set(
  fs
    .readdirSync(viewsDir)
    .filter((fileName) => fileName.endsWith('.ejs'))
    .map((fileName) => path.parse(fileName).name)
);

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Parse cookies (used for JWT cookie-based auth).
app.use(cookieParser());

// Connect to database before proceeding to session and routing logic
const connectDB = require('./config/db');
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(new Error('Database connection failed: ' + error.message));
  }
});

// Session support for authentication and user state.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Middleware to pass user to all views
app.use(async (req, res, next) => {
  if (!req.user && req.cookies && req.cookies.as_token) {
    try {
      const decoded = jwt.verify(req.cookies.as_token, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore invalid/expired token
    }
  }
  res.locals.user = req.user || null;
  next();
});

// Middleware to force profile completion for OAuth customers who haven't finished yet.
// Email/password users (authProvider === 'local') are never redirected here.
app.use((req, res, next) => {
  const isOAuthUser = req.user && (
    req.user.authProvider === 'google' ||
    req.user.authProvider === 'facebook' ||
    req.user.googleId ||
    req.user.facebookId
  );

  if (
    req.user &&
    req.user.role === 'customer' &&
    isOAuthUser &&
    !req.user.profileCompleted &&
    req.path !== '/complete-profile'
  ) {
    const isApi = req.path.startsWith('/api');
    const isAuth = req.path.startsWith('/auth');
    const isStatic = req.path.startsWith('/public') || req.path.startsWith('/services');

    // Allow static assets and logout
    if (isStatic || req.path === '/auth/logout') return next();

    // Allow auth routes (passport callbacks etc.)
    if (isAuth) return next();

    // Allow unauthenticated API auth endpoints so a client can login/register
    const allowApiPaths = ['/api/users/login', '/api/users/register', '/api/users/complete-profile'];
    if (isApi && allowApiPaths.includes(req.path)) return next();

    // For API calls, return a JSON error so the frontend client can handle it
    if (isApi) {
      return res.status(403).json({ message: 'Profile completion required', redirect: '/complete-profile' });
    }

    // Otherwise redirect browser requests to the completion page
    return res.redirect('/complete-profile');
  }
  next();
});

// Make the Public folder available for CSS, JavaScript, and images.
// Use gzip/deflate compression to reduce payload sizes on Vercel and browsers
app.use(compression());

// Serve static assets with long cache lifetimes; Vercel will serve these efficiently.
app.use('/public', express.static(path.join(__dirname, 'public'), { maxAge: '30d' }));
app.use('/services', express.static(path.join(__dirname, 'public', 'images', 'services'), { maxAge: '30d' }));

// Return the main HTML page when the browser opens the home route.
app.get('/', (req, res) => {
  res.status(200).render('index');
});

// Protected routes - require authentication
app.get('/my-bookings', isAuthenticated, (req, res) => {
  res.status(200).render('my-bookings');
});

app.get('/profile', isAuthenticated, (req, res) => {
  res.status(200).render('profile');
});

app.get('/admin-dashboard', isAuthenticated, (req, res) => {
  res.status(200).render('admin-dashboard');
});

app.get('/staff-dashboard', isAuthenticated, (req, res) => {
  res.status(200).render('staff-dashboard');
});

app.get('/complete-profile', isAuthenticated, (req, res) => {
  if (req.user && req.user.profileCompleted) {
    return res.redirect('/');
  }
  res.status(200).render('complete-profile');
});

// ─── API ROUTES ───────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff-codes', staffCodeRoutes);
app.use('/api/coupons', couponRoutes);

// Keep existing links working: /booking.ejs -> render booking.ejs.
app.get('/:page.ejs', (req, res, next) => {
  const page = req.params.page;

  if (!availableViews.has(page)) {
    return next();
  }

  return res.status(200).render(page);
});

// Also support clean routes: /booking -> render booking.ejs.
app.get('/:page', (req, res, next) => {
  const page = req.params.page;

  if (!availableViews.has(page)) {
    return next();
  }

  return res.status(200).render(page);
});

// Handle unknown routes with a 404 error.
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized error handling middleware.
app.use(errorHandler);

module.exports = app;
const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const contactRoutes = require('./routes/contactRoutes');
const issueRoutes = require('./routes/issueRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies (used for JWT cookie-based auth).
app.use(cookieParser());

// Make the Public folder available for CSS, JavaScript, and images.
app.use('/public', express.static(path.join(__dirname, 'public')));

// Return the main HTML page when the browser opens the home route.
app.get('/', (req, res) => {
  res.status(200).render('index');
});

// ─── API ROUTES ───────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/inventory', inventoryRoutes);

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
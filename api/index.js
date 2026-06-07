const app = require('../app');
const connectDB = require('../config/db');

// Connect to MongoDB (Mongoose buffers queries until connected)
connectDB().catch(err => console.error('MongoDB connection error:', err));

// Export the raw express app (Vercel's @vercel/node handles it natively)
module.exports = app;
const mongoose = require('mongoose');

// Connects the app to MongoDB.
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('Already connected to MongoDB');
    return;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webprojectcar_demo';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
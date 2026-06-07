const mongoose = require('mongoose');

// Disable query buffering globally to prevent queries from hanging when database is not connected
mongoose.set('bufferCommands', false);

let cachedPromise = null;

// Connects the app to MongoDB.
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    console.log('Initiating new MongoDB connection...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/webprojectcar_demo';
    
    // Configure mongoose to connect with a 5-second timeout to fail fast on network blocks
    cachedPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then(async (mongooseInstance) => {
      console.log('Connected to MongoDB');
      
      // Programmatically drop problematic unique indexes (googleId_1, facebookId_1) if they exist
      try {
        const db = mongooseInstance.connection.db;
        const collections = await db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
          const indexes = await db.collection('users').indexes();
          
          const hasGoogleUnique = indexes.some(idx => idx.name === 'googleId_1' && idx.unique);
          if (hasGoogleUnique) {
            console.log('Dropping unique index googleId_1 to prevent E11000 duplicate key errors...');
            await db.collection('users').dropIndex('googleId_1');
            console.log('Successfully dropped unique index googleId_1');
          }
          
          const hasFacebookUnique = indexes.some(idx => idx.name === 'facebookId_1' && idx.unique);
          if (hasFacebookUnique) {
            console.log('Dropping unique index facebookId_1 to prevent E11000 duplicate key errors...');
            await db.collection('users').dropIndex('facebookId_1');
            console.log('Successfully dropped unique index facebookId_1');
          }
        }
      } catch (indexError) {
        console.warn('Note: Could not inspect or drop unique indexes:', indexError.message);
      }
      
      return mongooseInstance.connection;
    });
  }

  try {
    await cachedPromise;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    cachedPromise = null; // Reset cache so next attempt tries again
    throw error;
  }

  return mongoose.connection;
};

module.exports = connectDB;
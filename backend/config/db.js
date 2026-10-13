const mongoose = require('mongoose');

let lastDbError = null;

const connectDB = async () => {
  // If already connected, reuse existing connection (crucial for serverless)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    lastDbError = 'MONGO_URI is not set in environment variables';
    console.error(`❌ ${lastDbError}`);
    return null;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of hanging
    });

    lastDbError = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      lastDbError = err.message;
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    return conn;
  } catch (error) {
    lastDbError = error.message;
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // DO NOT call process.exit(1) on Vercel serverless, as it crashes the entire function container
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    return null;
  }
};

const getDbError = () => lastDbError;

module.exports = connectDB;
module.exports.getDbError = getDbError;

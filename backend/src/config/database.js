const mongoose = require('mongoose');
const logger = require('../middleware/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      // Fail a stuck query in 20s instead of holding the request for 45s.
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000,
      // Keep the pool small enough for Atlas shared/M0 tiers, keep a few warm.
      maxPoolSize: 20,
      minPoolSize: 2,
      // Drop idle sockets before network middleboxes silently kill them.
      maxIdleTimeMS: 60000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      family: 4, // Avoid slow IPv6 resolution attempts on some hosts
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

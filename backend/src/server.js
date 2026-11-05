require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./middleware/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB connected successfully');

    // Auto-seed initial data if database is empty or FORCE_SEED=true
    try {
      const User = require('./models/User');
      const Client = require('./models/Client');
      const userCount = await User.countDocuments();
      const clientCount = await Client.countDocuments();
      if (userCount === 0 || clientCount === 0 || process.env.FORCE_SEED === 'true') {
        logger.info('🌱 Empty or partially seeded database detected on startup — automatically seeding initial data...');
        const { seedDatabase } = require('./scripts/seed');
        await seedDatabase(process.env.FORCE_SEED === 'true');
        logger.info('✅ Auto-seed completed successfully!');
      } else {
        logger.info(`ℹ️  Database contains ${userCount} existing users and ${clientCount} clients — skipping seed.`);
      }
    } catch (seedErr) {
      logger.warn('Auto-seed check notice: ' + seedErr.message);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Orbelo Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`🔗 Health: http://localhost:${PORT}/health`);
      logger.info(`📡 API Base: http://localhost:${PORT}/api`);
      if (process.env.AVINODE_MOCK_MODE === 'true' || !process.env.AVINODE_API_KEY) {
        logger.warn('⚠️  Avinode running in MOCK mode — set AVINODE_API_KEY and AVINODE_MOCK_MODE=false for live data');
      }
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received — gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed');
        const mongoose = require('mongoose');
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

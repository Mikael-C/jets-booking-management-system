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

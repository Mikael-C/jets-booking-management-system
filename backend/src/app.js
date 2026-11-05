require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const logger = require('./middleware/logger');

// Route imports
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const agentRequestRoutes = require('./routes/agentRequests');
const clientRoutes = require('./routes/clients');
const operatorRoutes = require('./routes/operators');
const fleetRoutes = require('./routes/fleet');
const quoteRoutes = require('./routes/quotes');
const paymentRoutes = require('./routes/payments');
const documentRoutes = require('./routes/documents');
const avinodeRoutes = require('./routes/avinode');
const airportRoutes = require('./routes/airports');
const jetImageRoutes = require('./routes/jetImages');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const auditLogRoutes = require('./routes/auditLog');
const sourcingRoutes = require('./routes/sourcing');
const userRoutes = require('./routes/users');

const app = express();

// ─── Security & Core Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Orbelo Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'Orbelo Private Aviation API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

// ─── Public Routes (no auth required) ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/airports', airportRoutes);

// ─── Protected Routes ─────────────────────────────────────────────────────────
app.use('/api/bookings', authenticate, bookingRoutes);
app.use('/api/agent-requests', authenticate, agentRequestRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/operators', authenticate, operatorRoutes);
app.use('/api/fleet', fleetRoutes); // GET fleet is public for frontend display
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/avinode', authenticate, avinodeRoutes);
app.use('/api/jet-images', authenticate, jetImageRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/audit-log', authenticate, auditLogRoutes);
app.use('/api/sourcing', authenticate, sourcingRoutes);
app.use('/api/users', authenticate, userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

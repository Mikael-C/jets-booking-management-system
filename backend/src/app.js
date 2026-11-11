require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate, optionalAuthenticate } = require('./middleware/auth');
const logger = require('./middleware/logger');

// Route imports
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const agentRequestRoutes = require('./routes/agentRequests');
const clientRoutes = require('./routes/clients');
const contactRoutes = require('./routes/contacts');
const operatorRoutes = require('./routes/operators');
const fleetRoutes = require('./routes/fleet');
const quoteRoutes = require('./routes/quotes');
const invoiceRoutes = require('./routes/invoices');
const flightBriefRoutes = require('./routes/flightBriefs');
const contractRoutes = require('./routes/contracts');
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
const tokenRoutes = require('./routes/tokens');
const messageRoutes = require('./routes/messages');

const app = express();

// ─── Security & Core Middleware ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Mobile apps, Postman, curl, server-to-server, health checks
  
  const frontendEnv = process.env.FRONTEND_URL;
  if (frontendEnv === '*' || !frontendEnv) return true;

  // Split multiple comma-separated URLs and clean trailing slashes
  const configured = frontendEnv
    .split(',')
    .map(u => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (configured.includes(origin)) return true;

  // Always allow localhost & local development ports
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;

  // Always allow all Vercel domains & preview deployments (*.vercel.app)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(origin)) return true;

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// ─── URL Normalization & Auto-API Prefix Middleware ───────────────────────────
// Handles cases where frontend calls //clients or /clients instead of /api/clients
app.use((req, res, next) => {
  if (req.url.startsWith('//')) {
    req.url = req.url.replace(/^\/+/, '/');
  }
  const nonApiPaths = ['/health', '/api/health', '/api-docs', '/', '/seed', '/api/seed'];
  if (!req.url.startsWith('/api/') && !nonApiPaths.includes(req.url.split('?')[0])) {
    req.url = `/api${req.url}`;
  }
  next();
});

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

// ─── One-Time Seed Trigger (for free-tier hosting without shell access) ───────
app.all(['/api/seed', '/seed'], async (req, res) => {
  const secret = req.query.secret || req.body?.secret || req.headers['x-seed-secret'];
  const expectedSecret = process.env.SEED_SECRET || 'orbelo2026!';
  if (secret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Pass ?secret=orbelo2026! to seed the database',
    });
  }
  const { seedDatabase } = require('./scripts/seed');
  const result = await seedDatabase(req.query.force === 'true');
  res.json({
    success: true,
    message: 'Database seed operation executed successfully!',
    result,
  });
});

// ─── Public Routes (no auth required) ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/airports', airportRoutes);

// ─── Protected Routes ─────────────────────────────────────────────────────────
app.use('/api/bookings', authenticate, bookingRoutes);
app.use('/api/agent-requests', authenticate, agentRequestRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/contacts', authenticate, contactRoutes);
app.use('/api/operators', authenticate, operatorRoutes);
app.use('/api/fleet', fleetRoutes); // GET fleet is public for frontend display
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/invoices', optionalAuthenticate, invoiceRoutes);
app.use('/api/flight-briefs', optionalAuthenticate, flightBriefRoutes);
app.use('/api/contracts', optionalAuthenticate, contractRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/avinode', authenticate, avinodeRoutes);
app.use('/api/jet-images', authenticate, jetImageRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/audit-log', authenticate, auditLogRoutes);
app.use('/api/sourcing', authenticate, sourcingRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/tokens', authenticate, tokenRoutes);
app.use('/api/messages', authenticate, messageRoutes);

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

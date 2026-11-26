const rateLimit = require('express-rate-limit');
const jwtConfig = require('../config/jwt');

// Key signed-in users by their user id so people behind the same network (or
// a shared proxy) don't exhaust each other's budget. Falls back to the client
// IP, which is correct only because app.js sets `trust proxy`.
const userOrIpKey = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwtConfig.verifyAccessToken(authHeader.split(' ')[1]);
      if (decoded && decoded.id) return `user:${decoded.id}`;
    } catch (_) {
      // Invalid/expired token: rate-limit by IP instead.
    }
  }
  return `ip:${req.ip}`;
};

const createRateLimiter = (windowMs, max, message, extra = {}) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development',
    ...extra,
  });

// General API rate limit (per signed-in user, or per IP when anonymous)
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  2000,
  'Too many requests, please try again after 15 minutes',
  {
    keyGenerator: userOrIpKey,
    skip: (req) =>
      process.env.NODE_ENV === 'development' ||
      req.path === '/health' ||
      req.originalUrl.startsWith('/api/auth/login'), // has its own limiter
  }
);

// Auth route limiter (stricter, per IP). Only failed attempts count.
const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts, please try again after 15 minutes',
  { skipSuccessfulRequests: true }
);

// PDF generation limiter
const pdfLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many PDF requests, please try again in a minute',
  { keyGenerator: userOrIpKey }
);

// Avinode API limiter
const avinodeLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Too many Avinode API requests, please slow down',
  { keyGenerator: userOrIpKey }
);

module.exports = { apiLimiter, authLimiter, pdfLimiter, avinodeLimiter };

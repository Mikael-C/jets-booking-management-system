const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development',
  });

// General API rate limit
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  500,
  'Too many requests from this IP, please try again after 15 minutes'
);

// Auth route limiter (stricter)
const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts, please try again after 15 minutes'
);

// PDF generation limiter
const pdfLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many PDF requests, please try again in a minute'
);

// Avinode API limiter
const avinodeLimiter = createRateLimiter(
  60 * 1000,
  30,
  'Too many Avinode API requests, please slow down'
);

module.exports = { apiLimiter, authLimiter, pdfLimiter, avinodeLimiter };

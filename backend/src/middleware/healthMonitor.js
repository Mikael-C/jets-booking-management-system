const { monitorEventLoopDelay } = require('perf_hooks');
const mongoose = require('mongoose');
const logger = require('./logger');

const MB = 1024 * 1024;
const INTERVAL_MS = Number(process.env.HEALTH_LOG_INTERVAL_MS) || 60000;
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS) || 5000;

/**
 * Logs one line per interval with event-loop delay and memory, so CPU
 * starvation or memory pressure on small instances shows up in the logs.
 */
const startHealthMonitor = () => {
  const loop = monitorEventLoopDelay({ resolution: 20 });
  loop.enable();

  // Round-trip time of a trivial command to the primary. Shows whether
  // slowness is in the app or between the app and MongoDB.
  const pingDb = async () => {
    if (mongoose.connection.readyState !== 1) return 'db=not-connected';
    const start = Date.now();
    try {
      await mongoose.connection.db.admin().ping();
      return `db-ping=${Date.now() - start}ms`;
    } catch (err) {
      return `db-ping=FAILED after ${Date.now() - start}ms (${err.message})`;
    }
  };

  const timer = setInterval(async () => {
    const ms = (ns) => Math.round(ns / 1e6);
    const mem = process.memoryUsage();
    const p50 = ms(loop.percentile(50));
    const p99 = ms(loop.percentile(99));
    const max = ms(loop.max);
    loop.reset();
    const db = await pingDb();
    const line =
      `health: ${db}, event-loop delay p50=${p50}ms p99=${p99}ms max=${max}ms, ` +
      `heap=${Math.round(mem.heapUsed / MB)}MB rss=${Math.round(mem.rss / MB)}MB`;
    // Production logger level is 'warn', so log at warn to keep these visible.
    logger.warn(max > 1000 ? `${line} (STALLED)` : line);
  }, INTERVAL_MS);
  timer.unref();
};

/** Express middleware: warns about any request slower than SLOW_REQUEST_MS. */
const slowRequestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const took = Number(process.hrtime.bigint() - start) / 1e6;
    if (took >= SLOW_REQUEST_MS) {
      logger.warn(`slow request: ${req.method} ${req.originalUrl} ${res.statusCode} took ${Math.round(took)}ms`);
    }
  });
  next();
};

module.exports = { startHealthMonitor, slowRequestLogger };

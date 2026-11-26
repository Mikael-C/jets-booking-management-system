const { monitorEventLoopDelay } = require('perf_hooks');
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

  const timer = setInterval(() => {
    const ms = (ns) => Math.round(ns / 1e6);
    const mem = process.memoryUsage();
    const p99 = ms(loop.percentile(99));
    const max = ms(loop.max);
    const line =
      `health: event-loop delay p50=${ms(loop.percentile(50))}ms p99=${p99}ms max=${max}ms, ` +
      `heap=${Math.round(mem.heapUsed / MB)}MB rss=${Math.round(mem.rss / MB)}MB`;
    // Production logger level is 'warn', so log at warn to keep these visible.
    logger.warn(max > 1000 ? `${line} (STALLED)` : line);
    loop.reset();
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

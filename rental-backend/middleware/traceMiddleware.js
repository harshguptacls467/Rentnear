const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * traceMiddleware — SRE Observability & Request Tracing Middleware
 *
 * Implements:
 * 1. Correlation IDs: Automatically reads/generates unique request-scope identifiers.
 * 2. structured request logging.
 * 3. Slow request warning log alerts if query latency exceeds 1.5 seconds.
 */
const traceMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  const start = process.hrtime();

  // Run the downstream lifecycle within the AsyncLocalStorage context
  logger.logStorage.run({ correlationId }, () => {
    // Audit log request on finish to track latency metrics
    res.on('finish', () => {
      const diff = process.hrtime(start);
      const latencyMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

      const logMeta = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        latency_ms: latencyMs,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
      };

      if (latencyMs > 1500) {
        logger.warn(`[SRE] Slow query latency warning: ${req.method} ${req.path} took ${latencyMs}ms`, logMeta);
      } else {
        logger.info(`${req.method} ${req.path} completed in ${latencyMs}ms`, logMeta);
      }
    });

    next();
  });
};

module.exports = traceMiddleware;

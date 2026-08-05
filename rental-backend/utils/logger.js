/**
 * logger.js — Structured application logger with credential redaction.
 *
 * Redacts any object field whose key matches a sensitive pattern (password,
 * token, key, secret, authorization, signature) before writing to stdout/stderr.
 * This prevents accidental credential exposure in log aggregators.
 */

// ── Sensitive field redaction ──────────────────────────────────────────────────

const SENSITIVE_KEYS = /password|token|key|secret|authorization|signature/i;

/**
 * Recursively redacts sensitive keys from an object.
 * Replaces their values with '[REDACTED]' — the key name itself is preserved
 * so log entries remain queryable.
 *
 * @param {any} obj — any value (object, array, primitive)
 * @returns redacted copy (does not mutate the original)
 */
const redact = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.test(k) ? '[REDACTED]' : redact(v),
    ])
  );
};

const { AsyncLocalStorage } = require('async_hooks');
const logStorage = new AsyncLocalStorage();

// ── Logger ─────────────────────────────────────────────────────────────────────

const getCorrelationId = () => {
  const store = logStorage.getStore();
  return store?.correlationId || null;
};

const logger = {
  info: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      correlation_id: getCorrelationId(),
      env: process.env.NODE_ENV || 'development',
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.log(`[INFO] ${log.timestamp} ${log.correlation_id ? `[Trace: ${log.correlation_id}] ` : ''}- ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },

  error: (message, error = null, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      correlation_id: getCorrelationId(),
      env: process.env.NODE_ENV || 'development',
      stack: error?.stack || null,
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[ERROR] ${log.timestamp} ${log.correlation_id ? `[Trace: ${log.correlation_id}] ` : ''}- ${message}`, error || '', Object.keys(meta).length ? redact(meta) : '');
    }
  },

  warn: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      correlation_id: getCorrelationId(),
      env: process.env.NODE_ENV || 'development',
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.warn(`[WARN] ${log.timestamp} ${log.correlation_id ? `[Trace: ${log.correlation_id}] ` : ''}- ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },

  security: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      message,
      correlation_id: getCorrelationId(),
      env: process.env.NODE_ENV || 'development',
      security_event: true,
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[SECURITY] ⚠️ ${log.timestamp} ${log.correlation_id ? `[Trace: ${log.correlation_id}] ` : ''}- ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },
};

logger.logStorage = logStorage;
module.exports = logger;

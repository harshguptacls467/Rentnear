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

// ── Logger ─────────────────────────────────────────────────────────────────────

const logger = {
  info: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      env: process.env.NODE_ENV || 'development',
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.log(`[INFO] ${log.timestamp} - ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },

  error: (message, error = null, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      env: process.env.NODE_ENV || 'development',
      // Stack traces are safe to log — they contain code paths, not credentials.
      stack: error?.stack || null,
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[ERROR] ${log.timestamp} - ${message}`, error || '', Object.keys(meta).length ? redact(meta) : '');
    }
  },

  warn: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      env: process.env.NODE_ENV || 'development',
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.warn(`[WARN] ${log.timestamp} - ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },

  security: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      message,
      env: process.env.NODE_ENV || 'development',
      security_event: true,
      ...redact(meta),
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[SECURITY] ⚠️ ${log.timestamp} - ${message}`, Object.keys(meta).length ? redact(meta) : '');
    }
  },
};

module.exports = logger;

const logger = {
  info: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      env: process.env.NODE_ENV || 'development',
      ...meta
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.log(`[INFO] ${log.timestamp} - ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (message, error = null, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      env: process.env.NODE_ENV || 'development',
      stack: error?.stack || null,
      ...meta
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[ERROR] ${log.timestamp} - ${message}`, error || '', Object.keys(meta).length ? meta : '');
    }
  },
  warn: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      env: process.env.NODE_ENV || 'development',
      ...meta
    };
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(log));
    } else {
      console.warn(`[WARN] ${log.timestamp} - ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  security: (message, meta = {}) => {
    const log = {
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      message,
      env: process.env.NODE_ENV || 'development',
      security_event: true,
      ...meta
    };
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(log));
    } else {
      console.error(`[SECURITY] ⚠️ ${log.timestamp} - ${message}`, Object.keys(meta).length ? meta : '');
    }
  }
};

module.exports = logger;

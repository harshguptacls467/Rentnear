const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log the complete error stack on the server for debugging
  console.error(`[ERROR] [${new Date().toISOString()}] Path: ${req.path} | Message: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'An unexpected error occurred.';
  let errCode = err.code || null;

  // 1. Handle JSON Parsing Errors (e.g. malformed JSON request bodies)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON request payload format.';
  }

  // 2. Handle JWT / Auth Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // 3. Handle PostgreSQL / Database Errors (Supabase Client codes)
  if (errCode) {
    switch (errCode) {
      case '23505': // Unique key violation
        statusCode = 409;
        message = 'This resource already exists (duplicate key constraint).';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referenced database resource does not exist.';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required database fields are missing.';
        break;
      case '22P02': // Invalid text representation (e.g. malformed UUID)
        statusCode = 400;
        message = 'Invalid query data format (e.g., malformed UUID or ID).';
        break;
      default:
        // Other db codes can be logged as-is
        break;
    }
  }

  // 4. Sanitize production messages for 500 Internal Server Errors
  if (statusCode === 500 && !isDev) {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  // 5. Respond to client
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      status: statusCode,
      code: errCode || undefined,
      ...(isDev && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;

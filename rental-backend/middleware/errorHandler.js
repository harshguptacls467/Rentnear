const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log the full error on the server
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    error: {
      message: isDev ? (err.message || 'Internal Server Error') : 'An unexpected error occurred.',
      status: statusCode,
      ...(isDev && { stack: err.stack }),
    }
  });
};

module.exports = errorHandler;


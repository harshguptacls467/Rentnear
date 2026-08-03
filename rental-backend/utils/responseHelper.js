/**
 * Standardized API Response Helpers
 * Reduces boilerplate and ensures uniform JSON response contracts across all API endpoints.
 */

/**
 * Send a standardized success response
 */
const sendSuccess = (res, data = null, statusCode = 200, extra = {}) => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return res.status(statusCode).json({
      success: true,
      ...data,
      ...extra
    });
  }
  return res.status(statusCode).json({
    success: true,
    data,
    ...extra
  });
};

/**
 * Send a standardized error response
 */
const sendError = (res, message = 'An error occurred', statusCode = 400, details = null) => {
  const payload = {
    success: false,
    error: {
      message,
      status: statusCode
    }
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};

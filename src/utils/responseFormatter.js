/**
 * Format a successful API response
 * @param {string} message - Success message
 * @param {object} data - Response data (optional)
 * @returns {object} - Formatted response
 */
function successResponse(message, data = null) {
  return {
    status: 'success',
    message,
    ...(data && { data }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format an error API response
 * @param {string} message - Error message
 * @param {object} errors - Validation errors or details (optional)
 * @returns {object} - Formatted error response
 */
function errorResponse(message, errors = null) {
  return {
    status: 'error',
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  successResponse,
  errorResponse,
};

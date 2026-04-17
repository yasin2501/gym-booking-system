/**
 * Centralized Error Handler Middleware
 * Catches and formats all errors consistently
 * Place: src/middleware/errorHandler.js
 */

const { errorResponse } = require('../utils/responseFormatter');

/**
 * Error Types
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Centralized Error Handler Middleware
 * Must be the last middleware in app.js
 */
const errorHandler = (err, req, res, next) => {
  // Default error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle specific error types
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
  }

  if (err.code === 'ER_FOREIGN_KEY_CONSTRAINT') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error details (in production, use a logger like Winston)
  if (statusCode >= 500) {
    console.error('ERROR:', {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      message,
      stack: err.stack,
      user_id: req.user?.user_id || 'anonymous'
    });
  }

  // Send error response
  res.status(statusCode).json(
    errorResponse(message, details)
  );
};

/**
 * Async Route Wrapper
 * Wraps async route handlers to catch errors
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Handler
 * Place this before errorHandler in app.js
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError('Endpoint');
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};

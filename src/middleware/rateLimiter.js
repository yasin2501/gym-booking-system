/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and abuse
 * Place: src/middleware/rateLimiter.js
 */

const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * 15 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for test requests or health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.user_id || req.ip;
  }
});

/**
 * Auth Rate Limiter (Stricter)
 * 5 requests per 15 minutes per IP
 * Applied to login and register endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Do count failed attempts
  keyGenerator: (req) => {
    // Rate limit by email for login attempts
    return req.body?.email || req.ip;
  }
});

/**
 * Booking Rate Limiter (Moderate)
 * 20 requests per 1 hour per user
 * Prevents users from booking too many classes too quickly
 */
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 bookings
  message: 'You have made too many booking requests. Please wait before booking again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user?.user_id || req.ip;
  }
});

/**
 * Payment Rate Limiter (Moderate)
 * 10 payment requests per 1 hour
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many payment requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.user_id || req.ip;
  }
});

/**
 * Admin API Rate Limiter (Strict)
 * 100 requests per 1 hour for admin operations
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Admin rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.user_id || req.ip;
  }
});

/**
 * Very Strict Rate Limiter for Password Reset
 * 3 requests per 1 hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email || req.ip;
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  bookingLimiter,
  paymentLimiter,
  adminLimiter,
  passwordResetLimiter
};

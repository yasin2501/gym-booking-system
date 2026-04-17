/**
 * Validation Middleware
 * Validates request body, params, and query using Joi schemas
 * Place: src/middleware/validation.js
 */

const Joi = require('joi');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Generic validation middleware factory
 * Usage: validate(schema, 'body') or validate(schema, 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[source], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        return res.status(400).json(
          errorResponse('Validation failed', errors)
        );
      }

      // Replace the data with validated data
      req[source] = value;
      next();
    } catch (err) {
      return res.status(500).json(
        errorResponse('Validation error occurred')
      );
    }
  };
};

// ==================== VALIDATION SCHEMAS ====================

/**
 * AUTH SCHEMAS
 */
const authSchemas = {
  register: Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
      }),
    phone: Joi.string().pattern(/^\d{10,}$/).required(),
    role: Joi.string().valid('member', 'trainer', 'admin').default('member')
  }).required(),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).required()
};

/**
 * TRAINER SCHEMAS
 */
const trainerSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().required(),
    bio: Joi.string().max(500),
    specializations: Joi.string().max(200),
    hourly_rate: Joi.number().positive().required(),
    availability_status: Joi.string().valid('available', 'unavailable', 'on_leave')
  }).required(),

  update: Joi.object({
    bio: Joi.string().max(500),
    specializations: Joi.string().max(200),
    hourly_rate: Joi.number().positive(),
    availability_status: Joi.string().valid('available', 'unavailable', 'on_leave')
  }).required()
};

/**
 * CLASS SCHEMAS
 */
const classSchemas = {
  create: Joi.object({
    trainer_id: Joi.number().integer().required(),
    class_name: Joi.string().min(3).max(100).required(),
    class_type: Joi.string().valid('yoga', 'cardio', 'strength', 'pilates', 'zumba').required(),
    schedule_day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
    start_time: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(),
    end_time: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required(),
    max_capacity: Joi.number().integer().min(1).max(100).required(),
    price_per_class: Joi.number().positive().required(),
    skill_level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    description: Joi.string().max(500)
  }).required(),

  update: Joi.object({
    class_name: Joi.string().min(3).max(100),
    class_type: Joi.string().valid('yoga', 'cardio', 'strength', 'pilates', 'zumba'),
    max_capacity: Joi.number().integer().min(1).max(100),
    price_per_class: Joi.number().positive(),
    skill_level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    description: Joi.string().max(500)
  }).required()
};

/**
 * BOOKING SCHEMAS
 */
const bookingSchemas = {
  create: Joi.object({
    class_id: Joi.number().integer().required()
  }).required(),

  updateAttendance: Joi.object({
    attended: Joi.boolean().required()
  }).required()
};

/**
 * PAYMENT SCHEMAS
 */
const paymentSchemas = {
  create: Joi.object({
    booking_id: Joi.number().integer().required(),
    payment_method: Joi.string()
      .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash')
      .required(),
    amount: Joi.number().positive().required(),
    transaction_id: Joi.string().optional()
  }).required(),

  updateStatus: Joi.object({
    payment_status: Joi.string()
      .valid('pending', 'completed', 'failed', 'refunded')
      .required()
  }).required(),

  refund: Joi.object({
    reason: Joi.string().max(200).optional()
  }).required()
};

/**
 * QUERY SCHEMAS (for pagination)
 */
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }).unknown(true)
};

module.exports = {
  validate,
  authSchemas,
  trainerSchemas,
  classSchemas,
  bookingSchemas,
  paymentSchemas,
  querySchemas
};

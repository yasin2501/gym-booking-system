const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const {
  validateEmail,
  validatePassword,
  validateRequiredFields,
} = require('../utils/validators');

/**
 * Auth Controller
 * Handles authentication endpoints (register, login)
 */

/**
 * POST /api/auth/register
 * Register a new user
 */
async function register(req, res) {
  try {
    const {
      email: rawEmail,
      password,
      first_name,
      last_name,
      phone,
      role,
    } = req.body;
    const email = String(rawEmail || '').trim().toLowerCase();

    // Validate required fields
    const requiredValidation = validateRequiredFields(
      { email, password, first_name, last_name },
      ['email', 'password', 'first_name', 'last_name']
    );

    if (!requiredValidation.isValid) {
      return res.status(400).json(
        errorResponse(
          'Missing required fields',
          requiredValidation.missingFields
        )
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json(
        errorResponse(
          'Password does not meet requirements',
          passwordValidation.errors
        )
      );
    }

    // Call auth service
    const result = await authService.register({
      email,
      password,
      first_name,
      last_name,
      phone: phone || null,
      role: role || 'member',
    });

    // Send successful response
    return res.status(201).json(
      successResponse('User registered successfully', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      })
    );
  } catch (error) {
    console.error('❌ Register Error:', error);

    // Check for specific error status codes
    if (error.statusCode === 400) {
      return res.status(400).json(errorResponse(error.message));
    }

    // Default error response
    return res.status(500).json(errorResponse('Registration failed. Please try again'));
  }
}

/**
 * POST /api/auth/login
 * Login user with email and password
 */
async function login(req, res) {
  try {
    const { email: rawEmail, password } = req.body;
    const email = String(rawEmail || '').trim().toLowerCase();

    // Validate required fields
    const requiredValidation = validateRequiredFields(
      { email, password },
      ['email', 'password']
    );

    if (!requiredValidation.isValid) {
      return res.status(400).json(
        errorResponse(
          'Missing required fields',
          requiredValidation.missingFields
        )
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Call auth service
    const result = await authService.login(email, password);

    // Send successful response
    return res.status(200).json(
      successResponse('Login successful', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      })
    );
  } catch (error) {
    console.error('❌ Login Error:', error);

    // Check for specific error status codes
    if (error.statusCode === 401) {
      return res.status(401).json(errorResponse(error.message));
    }

    if (error.statusCode === 403) {
      return res.status(403).json(errorResponse(error.message));
    }

    // Default error response
    return res.status(500).json(errorResponse('Login failed. Please try again'));
  }
}

module.exports = {
  register,
  login,
};

const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * Auth Routes
 * Handles user authentication endpoints
 */

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "phone": "555-1234",
 *   "role": "member"  // Optional, defaults to 'member'
 * }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login user with email and password
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!"
 * }
 */
router.post('/login', authController.login);

module.exports = router;

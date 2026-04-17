const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

/**
 * Auth Service
 * Handles authentication business logic
 */

/**
 * Register a new user
 * @param {object} userData - { email, password, first_name, last_name, phone, role }
 * @returns {Promise<object>} - { user, accessToken, refreshToken }
 */
async function register(userData) {
  try {
    const normalizedEmail = String(userData.email || '').trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user in database
    const newUser = await User.create({
      email: normalizedEmail,
      password_hash: hashedPassword,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      role: userData.role || 'member',
    });

    // Generate tokens
    const tokenPayload = {
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Promise<object>} - { user, accessToken, refreshToken }
 */
async function login(email, password) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Find user by email
    const user = await User.findByEmail(normalizedEmail);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if account is active
    if (user.status !== 'active') {
      const error = new Error('Account is not active. Please contact support');
      error.statusCode = 403;
      throw error;
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Generate tokens
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  register,
  login,
};

const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {object} payload - Data to encode in token (typically user id and role)
 * @param {string} secret - Secret key for signing (from .env)
 * @param {string} expiresIn - Token expiry time (e.g., '24h', '1d')
 * @returns {string} - JWT token
 */
function generateAccessToken(payload, secret = process.env.JWT_SECRET, expiresIn = '24h') {
  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
  } catch (error) {
    throw new Error(`Access token generation failed: ${error.message}`);
  }
}

/**
 * Generate JWT refresh token
 * @param {object} payload - Data to encode in token
 * @param {string} secret - Secret key for signing
 * @param {string} expiresIn - Token expiry time (e.g., '7d')
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(payload, secret = process.env.JWT_SECRET, expiresIn = '7d') {
  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
  } catch (error) {
    throw new Error(`Refresh token generation failed: ${error.message}`);
  }
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key used to sign the token
 * @returns {object} - Decoded token payload if valid
 * @throws {Error} - If token is invalid or expired
 */
function verifyToken(token, secret = process.env.JWT_SECRET) {
  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Decode JWT token without verification (useful for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} - Decoded payload
 */
function decodeToken(token) {
  try {
    const payload = jwt.decode(token);
    return payload;
  } catch (error) {
    throw new Error(`Token decode failed: ${error.message}`);
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};

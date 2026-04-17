const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT token
 * 
 * Usage: app.use('/api/protected', authenticateToken, protectedRoute);
 */

/**
 * Verify JWT token and attach user info to request
 */
function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after 'Bearer '

    if (!token) {
      return res.status(401).json(
        errorResponse('Access token not provided. Please login first')
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object for use in controllers
    req.user = decoded;

    next();
  } catch (error) {
    console.error('❌ Auth Middleware Error:', error.message);

    // Token expired
    if (error.message === 'Token has expired') {
      return res.status(401).json(
        errorResponse('Token has expired. Please login again')
      );
    }

    // Invalid token
    if (error.message === 'Invalid token') {
      return res.status(401).json(
        errorResponse('Invalid token. Please provide a valid access token')
      );
    }

    // Default error
    return res.status(401).json(errorResponse('Authentication failed'));
  }
}

module.exports = {
  authenticateToken,
};

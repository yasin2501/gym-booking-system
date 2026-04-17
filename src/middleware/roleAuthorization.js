const { errorResponse } = require('../utils/responseFormatter');

/**
 * Role-Based Authorization Middleware
 * Restricts route access based on user role
 *
 * Usage: router.post('/admin-route', authenticateToken, authorize('admin'), controller);
 * Or multiple roles: authorize(['admin', 'trainer'])
 */

/**
 * Create authorization middleware for specific roles
 * @param {string|array} allowedRoles - Single role or array of roles
 * @returns {function} - Middleware function
 */
function authorize(allowedRoles) {
  // Convert string to array if needed
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Check if user is authenticated and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json(errorResponse('Authentication required'));
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(`Access denied. Required role(s): ${roles.join(', ')}`)
      );
    }

    // Role is authorized, proceed
    next();
  };
}

module.exports = {
  authorize,
};

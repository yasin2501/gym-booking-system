const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuthorization');

const router = express.Router();

/**
 * GET /api/users
 * Admin only
 */
router.get('/', authenticateToken, authorize('admin'), userController.getAllUsers);

/**
 * GET /api/users/:userId
 * Admin or owner
 */
router.get('/:userId', authenticateToken, userController.getUserById);

/**
 * PUT /api/users/:userId
 * Admin or owner
 */
router.put('/:userId', authenticateToken, userController.updateUser);

/**
 * DELETE /api/users/:userId
 * Admin only
 */
router.delete('/:userId', authenticateToken, authorize('admin'), userController.deleteUser);

module.exports = router;

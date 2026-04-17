const express = require('express');
const classController = require('../controllers/classController');
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Class Routes
 * Base path: /api/classes
 */

/**
 * GET /api/classes
 * Get all active classes (public)
 */
router.get('/', classController.getAllClasses);

/**
 * GET /api/classes/:classId
 * Get class details by ID (public)
 */
router.get('/:classId', classController.getClassById);

/**
 * POST /api/classes
 * Create new class (trainer or admin)
 */
router.post('/', authenticateToken, classController.createClass);

/**
 * PUT /api/classes/:classId
 * Update class information (trainer or admin)
 */
router.put('/:classId', authenticateToken, classController.updateClass);

/**
 * DELETE /api/classes/:classId
 * Cancel/archive a class (trainer or admin)
 */
router.delete('/:classId', authenticateToken, classController.deleteClass);

/**
 * GET /api/classes/:classId/bookings
 * Get all bookings for a class (trainer or admin)
 */
router.get('/:classId/bookings', authenticateToken, bookingController.getClassBookings);

module.exports = router;

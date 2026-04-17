const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Booking Routes
 * Base path: /api/bookings
 */

/**
 * GET /api/bookings/my-bookings
 * Get current user's bookings (authenticated users)
 */
router.get('/my-bookings', authenticateToken, bookingController.getMyBookings);

/**
 * GET /api/bookings/:bookingId
 * Get booking details (user or admin)
 */
router.get('/:bookingId', authenticateToken, bookingController.getBookingById);

/**
 * POST /api/bookings
 * Create new booking / Book a class (authenticated users)
 * 
 * Prevents:
 * - Double-booking (same user, same class)
 * - Over-capacity bookings
 * - Booking inactive classes
 */
router.post('/', authenticateToken, bookingController.createBooking);

/**
 * DELETE /api/bookings/:bookingId
 * Cancel a booking (user or admin)
 */
router.delete('/:bookingId', authenticateToken, bookingController.cancelBooking);

/**
 * PUT /api/bookings/:bookingId/attendance
 * Mark attendance (trainer or admin)
 */
router.put('/:bookingId/attendance', authenticateToken, bookingController.markAttendance);

module.exports = router;

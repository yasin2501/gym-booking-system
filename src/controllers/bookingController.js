const Booking = require('../models/Booking');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { validateRequiredFields } = require('../utils/validators');

/**
 * Booking Controller
 * Handles class booking management endpoints
 * Prevents double-booking and over-capacity bookings
 */

/**
 * GET /api/bookings/my-bookings
 * Get current user's bookings
 */
async function getMyBookings(req, res) {
  try {
    const userId = req.user.user_id;
    const status = req.query.status; // Optional filter

    const bookings = await Booking.getByUserId(userId, status);

    return res.status(200).json(
      successResponse('Your bookings retrieved successfully', { bookings, count: bookings.length })
    );
  } catch (error) {
    console.error('❌ Get My Bookings Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve bookings'));
  }
}

/**
 * GET /api/bookings/:bookingId
 * Get booking details
 */
async function getBookingById(req, res) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found'));
    }

    // Check authorization (user or admin)
    if (req.user.role !== 'admin' && req.user.user_id !== booking.user_id) {
      return res.status(403).json(errorResponse('Not authorized to view this booking'));
    }

    return res.status(200).json(successResponse('Booking retrieved successfully', booking));
  } catch (error) {
    console.error('❌ Get Booking Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve booking'));
  }
}

/**
 * GET /api/classes/:classId/bookings
 * Get all bookings for a class (admin/trainer only)
 */
async function getClassBookings(req, res) {
  try {
    const { classId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json(errorResponse('Class not found'));
    }

    // Check authorization (trainer of class or admin)
    const isTrainerOwner = Number(req.user.user_id) === Number(classObj.trainer_user_id);
    if (req.user.role !== 'admin' && !isTrainerOwner) {
      return res.status(403).json(errorResponse('Not authorized to view class roster'));
    }

    const bookings = await Booking.getByClassId(classId);

    return res.status(200).json(
      successResponse('Class bookings retrieved successfully', {
        class: classObj,
        bookings,
        total_bookings: bookings.length,
        available_seats: classObj.max_capacity - classObj.current_enrollment,
      })
    );
  } catch (error) {
    console.error('❌ Get Class Bookings Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve class bookings'));
  }
}

/**
 * POST /api/bookings
 * Create new booking (book a class)
 * Prevents: double-booking, over-capacity, inactive classes
 */
async function createBooking(req, res) {
  try {
    const { class_id } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    const validation = validateRequiredFields({ class_id }, ['class_id']);
    if (!validation.isValid) {
      return res.status(400).json(errorResponse('Missing required fields', validation.missingFields));
    }

    // Verify class exists and is active
    const classObj = await Class.findById(class_id);
    if (!classObj) {
      return res.status(404).json(errorResponse('Class not found'));
    }

    if (classObj.class_status !== 'active') {
      return res.status(400).json(errorResponse('This class is not available for booking'));
    }

    // CHECK 1: Prevent over-capacity bookings
    const hasCapacity = await Booking.hasAvailableCapacity(class_id);
    if (!hasCapacity) {
      return res.status(400).json(errorResponse('This class is at full capacity'));
    }

    // CHECK 2: Rebook cancelled entries instead of inserting duplicate rows
    const existingBooking = await Booking.findByUserAndClass(userId, class_id);
    if (existingBooking) {
      if (existingBooking.booking_status === 'cancelled') {
        const reactivated = await Booking.reactivateCancelled(existingBooking.booking_id);
        if (!reactivated) {
          return res.status(400).json(errorResponse('Failed to reactivate cancelled booking'));
        }

        await Class.updateEnrollment(class_id, 1);
        const reactivatedBooking = await Booking.findById(existingBooking.booking_id);

        return res.status(200).json(
          successResponse('Cancelled booking reactivated successfully. Payment is pending.', {
            booking: reactivatedBooking,
            next_step: 'Complete payment to confirm booking',
          })
        );
      }

      return res.status(400).json(
        errorResponse('You already have a booking record for this class. Please cancel/refund or contact admin to rebook.')
      );
    }

    // Create booking
    const booking = await Booking.create({
      user_id: userId,
      class_id: parseInt(class_id),
    });

    // Update class enrollment
    await Class.updateEnrollment(class_id, 1);

    const createdBooking = await Booking.findById(booking.booking_id);

    return res.status(201).json(
      successResponse('Booking created successfully. Payment is pending.', {
        booking: createdBooking,
        next_step: 'Complete payment to confirm booking',
      })
    );
  } catch (error) {
    console.error('❌ Create Booking Error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json(
        errorResponse('You already have a booking record for this class. Please cancel/refund or contact admin to rebook.')
      );
    }

    return res.status(500).json(errorResponse('Failed to create booking'));
  }
}

/**
 * DELETE /api/bookings/:bookingId
 * Cancel a booking
 */
async function cancelBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found'));
    }

    // Check authorization (user or admin)
    if (req.user.role !== 'admin' && req.user.user_id !== booking.user_id) {
      return res.status(403).json(errorResponse('Not authorized to cancel this booking'));
    }

    // Check if booking can be cancelled
    if (booking.booking_status !== 'confirmed') {
      return res.status(400).json(
        errorResponse(`Cannot cancel booking with status: ${booking.booking_status}`)
      );
    }

    // Cancel booking
    const cancelled = await Booking.cancel(bookingId, reason || null);
    if (!cancelled) {
      return res.status(400).json(errorResponse('Failed to cancel booking'));
    }

    // Update class enrollment (decrease)
    await Class.updateEnrollment(booking.class_id, -1);

    return res.status(200).json(
      successResponse('Booking cancelled successfully', {
        booking_id: bookingId,
        message: 'Refund will be processed if payment was completed',
      })
    );
  } catch (error) {
    console.error('❌ Cancel Booking Error:', error);
    return res.status(500).json(errorResponse('Failed to cancel booking'));
  }
}

/**
 * PUT /api/bookings/:bookingId/attendance
 * Mark attendance (trainer/admin only)
 */
async function markAttendance(req, res) {
  try {
    const { bookingId } = req.params;
    const { attendance_status } = req.body; // 'attended' or 'absent'

    // Validate attendance status
    if (!['attended', 'absent'].includes(attendance_status)) {
      return res.status(400).json(errorResponse('Invalid attendance status'));
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found'));
    }

    // Check authorization (trainer or admin)
    const isTrainerOwner = Number(req.user.user_id) === Number(booking.trainer_user_id);
    if (req.user.role !== 'admin' && !isTrainerOwner) {
      return res.status(403).json(errorResponse('Not authorized to mark attendance'));
    }

    // Idempotent behavior: repeated same-status updates should return success.
    if (
      booking.booking_status === 'completed' &&
      booking.attendance_status === attendance_status
    ) {
      return res.status(200).json(
        successResponse('Attendance already marked', { booking })
      );
    }

    // Update attendance
    const updated = await Booking.updateAttendance(bookingId, attendance_status);
    if (!updated) {
      return res.status(400).json(errorResponse('Failed to update attendance'));
    }

    const updatedBooking = await Booking.findById(bookingId);

    return res.status(200).json(
      successResponse('Attendance marked successfully', { booking: updatedBooking })
    );
  } catch (error) {
    console.error('❌ Mark Attendance Error:', error);
    return res.status(500).json(errorResponse('Failed to mark attendance'));
  }
}

module.exports = {
  getMyBookings,
  getBookingById,
  getClassBookings,
  createBooking,
  cancelBooking,
  markAttendance,
};

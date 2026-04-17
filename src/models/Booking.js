const { executeQuery } = require('../config/database');

/**
 * Booking Model
 * Handles all database queries related to class bookings
 * Includes logic to prevent double-booking and over-capacity bookings
 */

/**
 * Find booking by ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise<object|null>} - Booking object or null
 */
async function findById(bookingId) {
  try {
    const query = `
      SELECT b.*, c.class_name, c.class_type, c.start_time, c.schedule_day,
             u.first_name, u.last_name, t.user_id as trainer_user_id
      FROM bookings b
      JOIN classes c ON b.class_id = c.class_id
      JOIN trainers t ON c.trainer_id = t.trainer_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `;
    const results = await executeQuery(query, [bookingId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all bookings for a user
 * @param {number} userId - User ID
 * @param {string} status - Booking status filter (optional)
 * @returns {Promise<array>} - Array of booking objects
 */
async function getByUserId(userId, status = null) {
  try {
    let query = `
      SELECT b.*, c.class_name, c.class_type, c.start_time, c.schedule_day
      FROM bookings b
      JOIN classes c ON b.class_id = c.class_id
      WHERE b.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND b.booking_status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.schedule_day ASC, c.start_time ASC';

    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all bookings for a class
 * @param {number} classId - Class ID
 * @returns {Promise<array>} - Array of booking objects
 */
async function getByClassId(classId) {
  try {
    const query = `
      SELECT b.*, u.first_name, u.last_name, u.email, p.payment_status, p.payment_id, p.amount as recorded_payment_amount, p.payment_method
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.class_id = ? AND b.booking_status IN ('confirmed', 'completed')
      ORDER BY b.booking_date ASC
    `;
    const results = await executeQuery(query, [classId]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if user already booked this class
 * @param {number} userId - User ID
 * @param {number} classId - Class ID
 * @returns {Promise<boolean>} - True if user already has active booking
 */
async function checkDuplicateBooking(userId, classId) {
  try {
    const query = `
      SELECT COUNT(*) as count FROM bookings
      WHERE user_id = ? AND class_id = ?
    `;
    const results = await executeQuery(query, [userId, classId]);
    return results[0].count > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Find existing booking by user and class
 * @param {number} userId - User ID
 * @param {number} classId - Class ID
 * @returns {Promise<object|null>} - Existing booking or null
 */
async function findByUserAndClass(userId, classId) {
  try {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = ? AND class_id = ?
      LIMIT 1
    `;
    const results = await executeQuery(query, [userId, classId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if class has available capacity
 * @param {number} classId - Class ID
 * @returns {Promise<boolean>} - True if seats available
 */
async function hasAvailableCapacity(classId) {
  try {
    const query = `
      SELECT (max_capacity - current_enrollment) as available
      FROM classes
      WHERE class_id = ?
    `;
    const results = await executeQuery(query, [classId]);

    if (results.length === 0) return false;
    return results[0].available > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new booking
 * @param {object} bookingData - { user_id, class_id }
 * @returns {Promise<object>} - Created booking object
 */
async function create(bookingData) {
  try {
    const query = `
      INSERT INTO bookings (user_id, class_id, booking_status, attendance_status)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      bookingData.user_id,
      bookingData.class_id,
      'confirmed',
      'pending',
    ];

    const result = await executeQuery(query, values);

    return {
      booking_id: result.insertId,
      user_id: bookingData.user_id,
      class_id: bookingData.class_id,
      booking_status: 'confirmed',
      attendance_status: 'pending',
      booking_date: new Date().toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<boolean>} - True if cancelled
 */
async function cancel(bookingId, reason = null) {
  try {
    const query = `
      UPDATE bookings 
      SET booking_status = ?, cancellation_date = CURRENT_TIMESTAMP, cancellation_reason = ?
      WHERE booking_id = ?
    `;

    const result = await executeQuery(query, ['cancelled', reason || null, bookingId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Reactivate a cancelled booking for rebooking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<boolean>} - True if booking was reactivated
 */
async function reactivateCancelled(bookingId) {
  try {
    const query = `
      UPDATE bookings
      SET booking_status = 'confirmed',
          attendance_status = 'pending',
          cancellation_date = NULL,
          cancellation_reason = NULL,
          booking_date = CURRENT_TIMESTAMP
      WHERE booking_id = ? AND booking_status = 'cancelled'
    `;

    const result = await executeQuery(query, [bookingId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Update attendance status
 * @param {number} bookingId - Booking ID
 * @param {string} attendanceStatus - 'attended', 'absent', or 'pending'
 * @returns {Promise<boolean>} - True if updated
 */
async function updateAttendance(bookingId, attendanceStatus) {
  try {
    const existingRows = await executeQuery(
      'SELECT booking_status, attendance_status FROM bookings WHERE booking_id = ? LIMIT 1',
      [bookingId]
    );

    if (existingRows.length === 0) {
      return false;
    }

    const existing = existingRows[0];
    if (!['confirmed', 'completed'].includes(existing.booking_status)) {
      return false;
    }

    // Idempotent behavior: no-op updates are treated as success.
    if (
      existing.booking_status === 'completed' &&
      existing.attendance_status === attendanceStatus
    ) {
      return true;
    }

    const query = `
      UPDATE bookings
      SET attendance_status = ?, booking_status = 'completed'
      WHERE booking_id = ? AND booking_status IN ('confirmed', 'completed')
    `;

    const result = await executeQuery(query, [attendanceStatus, bookingId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Get user's bookings for a specific day (check for scheduling conflicts)
 * @param {number} userId - User ID
 * @param {string} scheduleDay - Day of week
 * @returns {Promise<array>} - Array of bookings on that day
 */
async function getBookingsByUserAndDay(userId, scheduleDay) {
  try {
    const query = `
      SELECT b.*, c.schedule_day, c.start_time, c.end_time
      FROM bookings b
      JOIN classes c ON b.class_id = c.class_id
      WHERE b.user_id = ? AND c.schedule_day = ? AND b.booking_status = 'confirmed'
    `;

    const results = await executeQuery(query, [userId, scheduleDay]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Count total bookings
 * @returns {Promise<number>} - Total booking count
 */
async function countBookings() {
  try {
    const query = 'SELECT COUNT(*) as total FROM bookings WHERE booking_status != ?';
    const results = await executeQuery(query, ['cancelled']);
    return results[0].total;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findById,
  getByUserId,
  getByClassId,
  checkDuplicateBooking,
  findByUserAndClass,
  hasAvailableCapacity,
  create,
  cancel,
  reactivateCancelled,
  updateAttendance,
  getBookingsByUserAndDay,
  countBookings,
};

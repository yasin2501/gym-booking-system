const { executeQuery } = require('../config/database');

/**
 * Payment Model
 * Handles all database queries related to payment transactions
 */

/**
 * Find payment by ID
 * @param {number} paymentId - Payment ID
 * @returns {Promise<object|null>} - Payment object or null
 */
async function findById(paymentId) {
  try {
    const query = 'SELECT * FROM payments WHERE payment_id = ?';
    const results = await executeQuery(query, [paymentId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Find payment by transaction ID
 * @param {string} transactionId - Transaction ID from payment provider
 * @returns {Promise<object|null>} - Payment object or null
 */
async function findByTransactionId(transactionId) {
  try {
    const query = 'SELECT * FROM payments WHERE transaction_id = ?';
    const results = await executeQuery(query, [transactionId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get payment by booking ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise<object|null>} - Payment object or null
 */
async function findByBookingId(bookingId) {
  try {
    const query = 'SELECT * FROM payments WHERE booking_id = ?';
    const results = await executeQuery(query, [bookingId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all payments for a user
 * @param {number} userId - User ID
 * @param {string} status - Payment status filter (optional)
 * @returns {Promise<array>} - Array of payment objects
 */
async function getByUserId(userId, status = null) {
  try {
    let query = `
      SELECT p.*, b.booking_id, c.class_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN classes c ON b.class_id = c.class_id
      WHERE p.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND p.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const results = await executeQuery(query, params);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new payment record
 * @param {object} paymentData - Payment information
 * @returns {Promise<object>} - Created payment object
 */
async function create(paymentData) {
  try {
    const query = `
      INSERT INTO payments (user_id, booking_id, transaction_id, payment_method, amount, currency, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      paymentData.user_id,
      paymentData.booking_id,
      paymentData.transaction_id || null,
      paymentData.payment_method,
      paymentData.amount,
      paymentData.currency || 'USD',
      'pending',
    ];

    const result = await executeQuery(query, values);

    return {
      payment_id: result.insertId,
      user_id: paymentData.user_id,
      booking_id: paymentData.booking_id,
      transaction_id: paymentData.transaction_id || null,
      payment_method: paymentData.payment_method,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update payment status
 * @param {number} paymentId - Payment ID
 * @param {string} status - New payment status
 * @param {string} transactionId - Transaction ID if completing payment
 * @returns {Promise<boolean>} - True if updated
 */
async function updateStatus(paymentId, status, transactionId = null) {
  try {
    let query = '';
    let params = [];

    if (status === 'completed' && transactionId) {
      query = `
        UPDATE payments 
        SET payment_status = ?, transaction_id = ?, payment_date = CURRENT_TIMESTAMP
        WHERE payment_id = ?
      `;
      params = [status, transactionId, paymentId];
    } else if (status === 'refunded') {
      query = `
        UPDATE payments 
        SET payment_status = ?, refund_date = CURRENT_TIMESTAMP
        WHERE payment_id = ?
      `;
      params = [status, paymentId];
    } else {
      query = 'UPDATE payments SET payment_status = ? WHERE payment_id = ?';
      params = [status, paymentId];
    }

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Request refund for a payment
 * @param {number} paymentId - Payment ID
 * @param {string} reason - Refund reason
 * @returns {Promise<boolean>} - True if requested
 */
async function requestRefund(paymentId, reason) {
  try {
    const query = `
      UPDATE payments 
      SET payment_status = 'refund_requested', refund_reason = ?
      WHERE payment_id = ? AND payment_status = 'completed'
    `;

    const result = await executeQuery(query, [reason || null, paymentId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Process refund for a payment
 * @param {number} paymentId - Payment ID
 * @param {number} refundAmount - Amount to refund
 * @param {string} reason - Refund reason
 * @returns {Promise<boolean>} - True if refunded
 */
async function refund(paymentId, refundAmount, reason = null) {
  try {
    const query = `
      UPDATE payments 
      SET payment_status = 'refunded', refund_date = CURRENT_TIMESTAMP, 
          refund_amount = ?, refund_reason = ?
      WHERE payment_id = ? AND payment_status IN ('completed', 'refund_requested')
    `;

    const result = await executeQuery(query, [refundAmount, reason || null, paymentId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Get daily revenue report
 * @param {string} date - Date in format YYYY-MM-DD
 * @returns {Promise<object>} - Revenue summary
 */
async function getDailyRevenue(date) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds
      FROM payments
      WHERE DATE(payment_date) = ?
    `;

    const results = await executeQuery(query, [date]);
    return results[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Get payment statistics
 * @returns {Promise<object>} - Payment stats
 */
async function getStatistics() {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
        AVG(amount) as average_transaction
      FROM payments
    `;

    const results = await executeQuery(query);
    return results[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findById,
  findByTransactionId,
  findByBookingId,
  getByUserId,
  create,
  updateStatus,
  requestRefund,
  refund,
  getDailyRevenue,
  getStatistics,
};

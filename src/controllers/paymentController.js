const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { validateRequiredFields } = require('../utils/validators');
const { v4: uuidv4 } = require('uuid');

/**
 * Payment Controller
 * Handles payment processing and transaction management
 */

/**
 * GET /api/payments/my-payments
 * Get current user's payment history
 */
async function getMyPayments(req, res) {
  try {
    const userId = req.user.user_id;
    const status = req.query.status; // Optional filter: 'completed', 'pending', 'failed', 'refunded'

    const payments = await Payment.getByUserId(userId, status);

    return res.status(200).json(
      successResponse('Payment history retrieved successfully', {
        payments,
        count: payments.length,
      })
    );
  } catch (error) {
    console.error('❌ Get My Payments Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve payment history'));
  }
}

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
async function getPaymentById(req, res) {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found'));
    }

    // Check authorization (user or admin)
    if (req.user.role !== 'admin' && req.user.user_id !== payment.user_id) {
      return res.status(403).json(errorResponse('Not authorized to view this payment'));
    }

    return res.status(200).json(successResponse('Payment retrieved successfully', payment));
  } catch (error) {
    console.error('❌ Get Payment Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve payment'));
  }
}

/**
 * POST /api/payments
 * Process payment for a booking
 * In production, this would integrate with Stripe/PayPal
 */
async function processPayment(req, res) {
  try {
    const { booking_id, payment_method, amount } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    const validation = validateRequiredFields(
      { booking_id, payment_method, amount },
      ['booking_id', 'payment_method', 'amount']
    );

    if (!validation.isValid) {
      return res.status(400).json(errorResponse('Missing required fields', validation.missingFields));
    }

    // Validate payment method
    const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json(errorResponse('Invalid payment method'));
    }

    // Verify booking exists
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json(errorResponse('Booking not found'));
    }

    // Check authorization
    if (req.user.role !== 'admin' && userId !== booking.user_id) {
      return res.status(403).json(errorResponse('Not authorized to pay for this booking'));
    }

    // Check booking status
    if (booking.booking_status !== 'confirmed') {
      return res.status(400).json(errorResponse('Booking is not in confirmed status'));
    }

    // Check if payment already exists
    const existingPayment = await Payment.findByBookingId(booking_id);
    if (existingPayment && existingPayment.payment_status === 'completed') {
      return res.status(400).json(errorResponse('Payment already completed for this booking'));
    }

    // Validate amount matches class price
    const classObj = await Class.findById(booking.class_id);
    if (!classObj) {
      return res.status(404).json(errorResponse('Associated class not found'));
    }

    if (parseFloat(amount) !== parseFloat(classObj.price_per_class)) {
      return res.status(400).json(
        errorResponse(
          `Amount must match class price: $${classObj.price_per_class}. You provided: $${amount}`
        )
      );
    }

    // Create payment record
    const transactionId = uuidv4(); // Generate unique transaction ID

    let payment;
    if (existingPayment) {
      // Update existing pending payment
      payment = existingPayment;
      await Payment.updateStatus(payment.payment_id, 'completed', transactionId);
      payment = await Payment.findById(payment.payment_id);
    } else {
      // Create new payment record
      payment = await Payment.create({
        user_id: booking.user_id, // Assigned to the booking owner, not the admin making the request
        booking_id: parseInt(booking_id),
        transaction_id: transactionId,
        payment_method,
        amount: parseFloat(amount),
        currency: 'USD',
      });

      // Update to completed
      await Payment.updateStatus(payment.payment_id, 'completed', transactionId);
      payment = await Payment.findById(payment.payment_id);
    }

    // In production, here you would:
    // 1. Call external payment gateway (Stripe/PayPal)
    // 2. Handle payment response
    // 3. Update payment status based on response

    return res.status(201).json(
      successResponse('Payment processed successfully', {
        payment,
        receipt_url: `/api/payments/${payment.payment_id}/receipt`,
        message: 'Your booking is now confirmed. Check your email for confirmation details.',
      })
    );
  } catch (error) {
    console.error('❌ Process Payment Error:', error);
    return res.status(500).json(errorResponse('Payment processing failed'));
  }
}

/**
 * POST /api/payments/:paymentId/request-refund
 * Request refund for a payment (member only)
 */
async function requestRefundPayment(req, res) {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found'));
    }

    // Check authorization (only the payment owner can request refund)
    if (req.user.user_id !== payment.user_id) {
      return res.status(403).json(errorResponse('Not authorized to request refund for this payment'));
    }

    // Check payment status
    if (payment.payment_status !== 'completed') {
      return res.status(400).json(
        errorResponse(`Cannot request refund for payment with status: ${payment.payment_status}`)
      );
    }

    // Process refund request
    const requested = await Payment.requestRefund(paymentId, reason || 'Refund requested by member');
    if (!requested) {
      return res.status(400).json(errorResponse('Failed to request refund'));
    }

    const updatedPayment = await Payment.findById(paymentId);

    return res.status(200).json(
      successResponse('Refund requested successfully. Pending admin approval.', {
        payment: updatedPayment,
        message: 'Your refund request has been submitted to the admin for review.',
      })
    );
  } catch (error) {
    console.error('❌ Request Refund Error:', error);
    return res.status(500).json(errorResponse('Refund request failed'));
  }
}

/**
 * POST /api/payments/:paymentId/refund
 * Process refund for a payment (admin only)
 */
async function refundPayment(req, res) {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found'));
    }

    // Check authorization (must be admin, which is handled by authorize middleware in route)
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('Not authorized to process this refund. Admin access required.'));
    }

    // Check payment status
    if (payment.payment_status !== 'completed' && payment.payment_status !== 'refund_requested') {
      return res.status(400).json(
        errorResponse(`Cannot refund payment with status: ${payment.payment_status}`)
      );
    }

    // Process refund
    const refunded = await Payment.refund(paymentId, payment.amount, reason || payment.refund_reason || 'Refund processed by Admin');
    if (!refunded) {
      return res.status(400).json(errorResponse('Failed to process refund'));
    }

    const updatedPayment = await Payment.findById(paymentId);

    return res.status(200).json(
      successResponse('Refund processed successfully', {
        payment: updatedPayment,
        refund_amount: payment.amount,
        message: 'Refund has been successfully processed.',
      })
    );
  } catch (error) {
    console.error('❌ Refund Payment Error:', error);
    return res.status(500).json(errorResponse('Refund processing failed'));
  }
}

/**
 * GET /api/admin/payments/statistics
 * Get payment statistics (admin only)
 */
async function getStatistics(req, res) {
  try {
    const stats = await Payment.getStatistics();

    return res.status(200).json(
      successResponse('Payment statistics retrieved successfully', {
        statistics: {
          total_payments: stats.total_payments || 0,
          total_revenue: parseFloat(stats.total_revenue) || 0,
          pending_revenue: parseFloat(stats.pending_revenue) || 0,
          average_transaction: parseFloat(stats.average_transaction) || 0,
        },
      })
    );
  } catch (error) {
    console.error('❌ Get Statistics Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve statistics'));
  }
}

/**
 * GET /api/admin/payments/daily-report
 * Get daily revenue report (admin only)
 */
async function getDailyReport(req, res) {
  try {
    const date = req.query.date; // YYYY-MM-DD format

    if (!date) {
      return res.status(400).json(errorResponse('Date parameter required (YYYY-MM-DD format)'));
    }

    const revenue = await Payment.getDailyRevenue(date);

    return res.status(200).json(
      successResponse('Daily report retrieved successfully', {
        date,
        report: {
          total_transactions: revenue.total_transactions || 0,
          total_revenue: parseFloat(revenue.total_revenue) || 0,
          total_refunds: parseFloat(revenue.total_refunds) || 0,
          net_revenue: (parseFloat(revenue.total_revenue) || 0) - (parseFloat(revenue.total_refunds) || 0),
        },
      })
    );
  } catch (error) {
    console.error('❌ Get Daily Report Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve daily report'));
  }
}

/**
 * GET /api/payments/:paymentId/receipt
 * Get payment receipt (user or admin)
 */
async function getReceipt(req, res) {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json(errorResponse('Payment not found'));
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.user_id !== payment.user_id) {
      return res.status(403).json(errorResponse('Not authorized to view this receipt'));
    }

    // Get booking details
    const booking = await Booking.findById(payment.booking_id);

    // Return receipt data
    return res.status(200).json(
      successResponse('Receipt retrieved successfully', {
        receipt: {
          payment_id: payment.payment_id,
          transaction_id: payment.transaction_id,
          booking_id: payment.booking_id,
          class_name: booking.class_name,
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.payment_method,
          payment_date: payment.payment_date,
          status: payment.payment_status,
        },
      })
    );
  } catch (error) {
    console.error('❌ Get Receipt Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve receipt'));
  }
}

module.exports = {
  getMyPayments,
  getPaymentById,
  processPayment,
  requestRefundPayment,
  refundPayment,
  getStatistics,
  getDailyReport,
  getReceipt,
};

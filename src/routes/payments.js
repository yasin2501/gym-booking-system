const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuthorization');

const router = express.Router();

/**
 * Payment Routes
 * Base path: /api/payments
 */

/**
 * GET /api/payments/my-payments
 * Get current user's payment history (authenticated users)
 */
router.get('/my-payments', authenticateToken, paymentController.getMyPayments);

/**
 * GET /api/payments/:paymentId
 * Get payment details (user or admin)
 */
router.get('/:paymentId', authenticateToken, paymentController.getPaymentById);

/**
 * GET /api/payments/:paymentId/receipt
 * Get payment receipt (user or admin)
 */
router.get('/:paymentId/receipt', authenticateToken, paymentController.getReceipt);

/**
 * POST /api/payments
 * Process payment for a booking (authenticated users)
 */
router.post('/', authenticateToken, paymentController.processPayment);

/**
 * POST /api/payments/:paymentId/request-refund
 * Request a refund for a payment (authenticated users)
 */
router.post('/:paymentId/request-refund', authenticateToken, paymentController.requestRefundPayment);

/**
 * POST /api/payments/:paymentId/refund
 * Process refund for a payment (admin only)
 */
router.post('/:paymentId/refund', authenticateToken, authorize('admin'), paymentController.refundPayment);

/**
 * GET /api/admin/payments/statistics
 * Get payment statistics (admin only)
 */
router.get('/admin/statistics', authenticateToken, authorize('admin'), paymentController.getStatistics);

/**
 * GET /api/admin/payments/daily-report
 * Get daily revenue report (admin only)
 */
router.get('/admin/daily-report', authenticateToken, authorize('admin'), paymentController.getDailyReport);

module.exports = router;

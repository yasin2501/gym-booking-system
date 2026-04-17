const express = require('express');
const trainerController = require('../controllers/trainerController');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuthorization');

const router = express.Router();

/**
 * Trainer Routes
 * Base path: /api/trainers
 */

/**
 * GET /api/trainers
 * Get all trainers (public)
 */
router.get('/', trainerController.getAllTrainers);

/**
 * GET /api/trainers/:trainerId
 * Get trainer by ID (public)
 */
router.get('/:trainerId', trainerController.getTrainerById);

/**
 * POST /api/trainers
 * Create new trainer (admin only)
 */
router.post('/', authenticateToken, authorize('admin'), trainerController.createTrainer);

/**
 * PUT /api/trainers/:trainerId
 * Update trainer information (trainer or admin)
 */
router.put('/:trainerId', authenticateToken, authorize(['admin', 'trainer']), trainerController.updateTrainer);

/**
 * DELETE /api/trainers/:trainerId
 * Deactivate trainer (admin only)
 */
router.delete('/:trainerId', authenticateToken, authorize('admin'), trainerController.deleteTrainer);

module.exports = router;

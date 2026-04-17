const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { hashPassword } = require('../utils/passwordHash');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { validateRequiredFields } = require('../utils/validators');

/**
 * Trainer Controller
 * Handles trainer management endpoints
 */

/**
 * GET /api/trainers
 * Get all trainers with pagination
 */
async function getAllTrainers(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = parseInt(req.query.offset) || 0;

    const trainers = await Trainer.getAll(limit, offset);
    const total = await Trainer.countTrainers();

    return res.status(200).json(
      successResponse('Trainers retrieved successfully', {
        trainers,
        pagination: {
          limit,
          offset,
          total,
          page: Math.floor(offset / limit) + 1,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('❌ Get Trainers Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve trainers'));
  }
}

/**
 * GET /api/trainers/:trainerId
 * Get trainer by ID
 */
async function getTrainerById(req, res) {
  try {
    const { trainerId } = req.params;

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json(errorResponse('Trainer not found'));
    }

    return res.status(200).json(successResponse('Trainer retrieved successfully', trainer));
  } catch (error) {
    console.error('❌ Get Trainer Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve trainer'));
  }
}

/**
 * POST /api/trainers
 * Create new trainer (admin only)
 */
async function createTrainer(req, res) {
  try {
    const {
      user_id,
      email,
      password,
      first_name,
      last_name,
      phone,
      bio,
      specializations,
      certifications,
      hourly_rate,
    } = req.body;

    if (hourly_rate === undefined || Number.isNaN(parseFloat(hourly_rate))) {
      return res.status(400).json(errorResponse('Valid hourly_rate is required'));
    }

    let resolvedUserId = user_id ? parseInt(user_id, 10) : null;
    let createdUserId = null;

    if (resolvedUserId) {
      // Existing user flow
      const user = await User.findById(resolvedUserId);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      const existingTrainer = await Trainer.findByUserId(resolvedUserId);
      if (existingTrainer) {
        return res.status(400).json(errorResponse('User is already a trainer'));
      }

      if (user.role !== 'trainer') {
        await User.updateById(resolvedUserId, { role: 'trainer' });
      }
    } else {
      // New user flow
      const validation = validateRequiredFields(
        { email, password, first_name, last_name, hourly_rate },
        ['email', 'password', 'first_name', 'last_name', 'hourly_rate']
      );
      if (!validation.isValid) {
        return res.status(400).json(errorResponse('Missing required fields', validation.missingFields));
      }

      const normalizedEmail = String(email || '').trim().toLowerCase();

      const existingEmail = await User.findByEmail(normalizedEmail);
      if (existingEmail) {
        return res.status(400).json(errorResponse('Email already registered'));
      }

      const password_hash = await hashPassword(password);
      const newUser = await User.create({
        email: normalizedEmail,
        password_hash,
        first_name,
        last_name,
        phone,
        role: 'trainer',
      });

      resolvedUserId = newUser.user_id;
      createdUserId = newUser.user_id;
    }

    // Create trainer
    const trainer = await Trainer.create({
      user_id: resolvedUserId,
      bio,
      specializations,
      certifications,
      hourly_rate: parseFloat(hourly_rate),
    });

    return res.status(201).json(
      successResponse('Trainer created successfully', {
        ...trainer,
        created_new_user: Boolean(createdUserId),
        user_id: resolvedUserId,
      })
    );
  } catch (error) {
    console.error('❌ Create Trainer Error:', error);
    return res.status(500).json(errorResponse('Failed to create trainer'));
  }
}

/**
 * PUT /api/trainers/:trainerId
 * Update trainer information
 */
async function updateTrainer(req, res) {
  try {
    const { trainerId } = req.params;
    const { bio, specializations, certifications, hourly_rate, availability_status } = req.body;

    // Verify trainer exists
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json(errorResponse('Trainer not found'));
    }

    // Check if requester is the trainer or admin
    if (req.user.role !== 'admin' && req.user.user_id !== trainer.user_id) {
      return res.status(403).json(errorResponse('Not authorized to update this trainer'));
    }

    // Update trainer
    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (hourly_rate !== undefined) updateData.hourly_rate = parseFloat(hourly_rate);
    if (availability_status !== undefined) updateData.availability_status = availability_status;

    const updated = await Trainer.update(trainerId, updateData);
    if (!updated) {
      return res.status(400).json(errorResponse('No fields to update'));
    }

    const updatedTrainer = await Trainer.findById(trainerId);
    return res.status(200).json(successResponse('Trainer updated successfully', updatedTrainer));
  } catch (error) {
    console.error('❌ Update Trainer Error:', error);
    return res.status(500).json(errorResponse('Failed to update trainer'));
  }
}

/**
 * DELETE /api/trainers/:trainerId
 * Deactivate trainer (admin only)
 */
async function deleteTrainer(req, res) {
  try {
    const { trainerId } = req.params;

    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json(errorResponse('Trainer not found'));
    }

    const deactivated = await Trainer.deactivate(trainerId);
    if (!deactivated) {
      return res.status(400).json(errorResponse('Failed to deactivate trainer'));
    }

    return res.status(200).json(successResponse('Trainer deactivated successfully'));
  } catch (error) {
    console.error('❌ Delete Trainer Error:', error);
    return res.status(500).json(errorResponse('Failed to deactivate trainer'));
  }
}

module.exports = {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};

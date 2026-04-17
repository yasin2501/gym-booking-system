const Class = require('../models/Class');
const Trainer = require('../models/Trainer');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { validateRequiredFields } = require('../utils/validators');

/**
 * Class Controller
 * Handles fitness class management endpoints
 */

/**
 * GET /api/classes
 * Get all active classes with pagination
 */
async function getAllClasses(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = parseInt(req.query.offset) || 0;
    const classType = req.query.type; // Optional filter

    let classes = await Class.getAll(limit, offset);

    // Filter by class type if provided
    if (classType) {
      classes = classes.filter((c) => c.class_type === classType);
    }

    const total = await Class.countClasses();

    return res.status(200).json(
      successResponse('Classes retrieved successfully', {
        classes,
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
    console.error('❌ Get Classes Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve classes'));
  }
}

/**
 * GET /api/classes/:classId
 * Get class by ID
 */
async function getClassById(req, res) {
  try {
    const { classId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json(errorResponse('Class not found'));
    }

    const availability = await Class.getAvailability(classId);

    return res.status(200).json(
      successResponse('Class retrieved successfully', {
        ...classObj,
        ...availability,
      })
    );
  } catch (error) {
    console.error('❌ Get Class Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve class'));
  }
}

/**
 * GET /api/trainers/:trainerId/classes
 * Get all classes for a trainer
 */
async function getClassesByTrainer(req, res) {
  try {
    const { trainerId } = req.params;

    // Verify trainer exists
    const trainer = await Trainer.findById(trainerId);
    if (!trainer) {
      return res.status(404).json(errorResponse('Trainer not found'));
    }

    const classes = await Class.getByTrainerId(trainerId);

    return res.status(200).json(
      successResponse('Trainer classes retrieved successfully', { classes })
    );
  } catch (error) {
    console.error('❌ Get Trainer Classes Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve trainer classes'));
  }
}

/**
 * POST /api/classes
 * Create new class (trainer/admin only)
 */
async function createClass(req, res) {
  try {
    const {
      trainer_id,
      class_name,
      description,
      class_type,
      schedule_day,
      start_time,
      end_time,
      max_capacity,
      price_per_class,
      skill_level,
      location,
    } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(
      {
        trainer_id,
        class_name,
        class_type,
        schedule_day,
        start_time,
        end_time,
        max_capacity,
        price_per_class,
      },
      [
        'trainer_id',
        'class_name',
        'class_type',
        'schedule_day',
        'start_time',
        'end_time',
        'max_capacity',
        'price_per_class',
      ]
    );

    if (!validation.isValid) {
      return res.status(400).json(errorResponse('Missing required fields', validation.missingFields));
    }

    // Verify trainer exists
    const trainer = await Trainer.findById(trainer_id);
    if (!trainer) {
      return res.status(404).json(errorResponse('Trainer not found'));
    }

    // Check authorization (trainer can only create their own classes)
    if (req.user.role !== 'admin' && req.user.user_id !== trainer.user_id) {
      return res.status(403).json(errorResponse('Not authorized to create classes for this trainer'));
    }

    // Validate capacity
    if (parseInt(max_capacity) < 1) {
      return res.status(400).json(errorResponse('Max capacity must be at least 1'));
    }

    // Validate price
    if (parseFloat(price_per_class) < 0) {
      return res.status(400).json(errorResponse('Price cannot be negative'));
    }

    // Create class
    const newClass = await Class.create({
      trainer_id: parseInt(trainer_id),
      class_name,
      description,
      class_type,
      schedule_day,
      start_time,
      end_time,
      max_capacity: parseInt(max_capacity),
      price_per_class: parseFloat(price_per_class),
      skill_level,
      location,
    });

    return res.status(201).json(successResponse('Class created successfully', newClass));
  } catch (error) {
    console.error('❌ Create Class Error:', error);
    return res.status(500).json(errorResponse('Failed to create class'));
  }
}

/**
 * PUT /api/classes/:classId
 * Update class information (trainer/admin only)
 */
async function updateClass(req, res) {
  try {
    const { classId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json(errorResponse('Class not found'));
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.user_id !== classObj.trainer_user_id) {
      return res.status(403).json(errorResponse('Not authorized to update this class'));
    }

    const updateData = {};
    const allowedFields = [
      'class_name',
      'description',
      'class_type',
      'schedule_day',
      'start_time',
      'end_time',
      'max_capacity',
      'price_per_class',
      'skill_level',
      'location',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'max_capacity') {
          updateData[field] = parseInt(req.body[field]);
        } else if (field === 'price_per_class') {
          updateData[field] = parseFloat(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json(errorResponse('No fields to update'));
    }

    const updated = await Class.update(classId, updateData);
    if (!updated) {
      return res.status(400).json(errorResponse('Failed to update class'));
    }

    const updatedClass = await Class.findById(classId);
    return res.status(200).json(successResponse('Class updated successfully', updatedClass));
  } catch (error) {
    console.error('❌ Update Class Error:', error);
    return res.status(500).json(errorResponse('Failed to update class'));
  }
}

/**
 * DELETE /api/classes/:classId
 * Cancel/archive a class
 */
async function deleteClass(req, res) {
  try {
    const { classId } = req.params;

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json(errorResponse('Class not found'));
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.user_id !== classObj.trainer_user_id) {
      return res.status(403).json(errorResponse('Not authorized to cancel this class'));
    }

    const cancelled = await Class.cancel(classId);
    if (!cancelled) {
      return res.status(400).json(errorResponse('Failed to cancel class'));
    }

    return res.status(200).json(successResponse('Class cancelled successfully'));
  } catch (error) {
    console.error('❌ Delete Class Error:', error);
    return res.status(500).json(errorResponse('Failed to cancel class'));
  }
}

module.exports = {
  getAllClasses,
  getClassById,
  getClassesByTrainer,
  createClass,
  updateClass,
  deleteClass,
};

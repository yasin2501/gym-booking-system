const { executeQuery } = require('../config/database');

/**
 * Class Model
 * Handles all database queries related to fitness classes
 */

/**
 * Find class by ID
 * @param {number} classId - Class ID
 * @returns {Promise<object|null>} - Class object or null
 */
async function findById(classId) {
  try {
    const query = `
      SELECT c.*, t.user_id as trainer_user_id, u.first_name, u.last_name
      FROM classes c
      JOIN trainers t ON c.trainer_id = t.trainer_id
      JOIN users u ON t.user_id = u.user_id
      WHERE c.class_id = ?
    `;
    const results = await executeQuery(query, [classId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all active classes with pagination
 * @param {number} limit - Limit number of results
 * @param {number} offset - Offset for pagination
 * @returns {Promise<array>} - Array of class objects
 */
async function getAll(limit = 10, offset = 0) {
  try {
    const query = `
      SELECT c.*, t.user_id as trainer_user_id, u.first_name, u.last_name
      FROM classes c
      JOIN trainers t ON c.trainer_id = t.trainer_id
      JOIN users u ON t.user_id = u.user_id
      WHERE c.class_status = 'active'
      ORDER BY c.schedule_day ASC, c.start_time ASC
      LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(query, [limit, offset]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Get classes by trainer ID
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<array>} - Array of classes taught by trainer
 */
async function getByTrainerId(trainerId) {
  try {
    const query = `
      SELECT * FROM classes
      WHERE trainer_id = ? AND class_status = 'active'
      ORDER BY schedule_day ASC, start_time ASC
    `;
    const results = await executeQuery(query, [trainerId]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new class
 * @param {object} classData - Class information
 * @returns {Promise<object>} - Created class object
 */
async function create(classData) {
  try {
    const query = `
      INSERT INTO classes 
      (trainer_id, class_name, description, class_type, schedule_day, start_time, end_time, 
       max_capacity, price_per_class, skill_level, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      classData.trainer_id,
      classData.class_name,
      classData.description || null,
      classData.class_type,
      classData.schedule_day,
      classData.start_time,
      classData.end_time,
      classData.max_capacity,
      classData.price_per_class,
      classData.skill_level || 'intermediate',
      classData.location || null,
    ];

    const result = await executeQuery(query, values);

    return {
      class_id: result.insertId,
      trainer_id: classData.trainer_id,
      class_name: classData.class_name,
      class_type: classData.class_type,
      schedule_day: classData.schedule_day,
      start_time: classData.start_time,
      end_time: classData.end_time,
      max_capacity: classData.max_capacity,
      current_enrollment: 0,
      price_per_class: classData.price_per_class,
      skill_level: classData.skill_level || 'intermediate',
      class_status: 'active',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update class information
 * @param {number} classId - Class ID
 * @param {object} updateData - Fields to update
 * @returns {Promise<boolean>} - True if updated
 */
async function update(classId, updateData) {
  try {
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
      'class_status',
    ];

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return false;
    }

    values.push(classId);
    const query = `UPDATE classes SET ${updateFields.join(', ')} WHERE class_id = ?`;
    const result = await executeQuery(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Cancel a class
 * @param {number} classId - Class ID
 * @returns {Promise<boolean>} - True if cancelled
 */
async function cancel(classId) {
  try {
    const query = 'UPDATE classes SET class_status = ? WHERE class_id = ?';
    const result = await executeQuery(query, ['cancelled', classId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Update current enrollment count
 * @param {number} classId - Class ID
 * @param {number} delta - Change in enrollment (positive or negative)
 * @returns {Promise<boolean>} - True if updated
 */
async function updateEnrollment(classId, delta) {
  try {
    const query = `
      UPDATE classes 
      SET current_enrollment = current_enrollment + ? 
      WHERE class_id = ? AND (current_enrollment + ? >= 0)
    `;
    const result = await executeQuery(query, [delta, classId, delta]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Get class availability
 * @param {number} classId - Class ID
 * @returns {Promise<object|null>} - { available_seats, current_enrollment, max_capacity }
 */
async function getAvailability(classId) {
  try {
    const query = 'SELECT max_capacity, current_enrollment FROM classes WHERE class_id = ?';
    const results = await executeQuery(query, [classId]);

    if (results.length === 0) return null;

    const row = results[0];
    return {
      available_seats: row.max_capacity - row.current_enrollment,
      current_enrollment: row.current_enrollment,
      max_capacity: row.max_capacity,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Count total active classes
 * @returns {Promise<number>} - Total count
 */
async function countClasses() {
  try {
    const query = 'SELECT COUNT(*) as total FROM classes WHERE class_status = ?';
    const results = await executeQuery(query, ['active']);
    return results[0].total;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findById,
  getAll,
  getByTrainerId,
  create,
  update,
  cancel,
  updateEnrollment,
  getAvailability,
  countClasses,
};

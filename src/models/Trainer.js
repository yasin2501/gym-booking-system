const { executeQuery } = require('../config/database');

/**
 * Trainer Model
 * Handles all database queries related to trainers
 */

/**
 * Find trainer by ID
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<object|null>} - Trainer object or null
 */
async function findById(trainerId) {
  try {
    const query = 'SELECT * FROM trainers WHERE trainer_id = ?';
    const results = await executeQuery(query, [trainerId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Find trainer by user ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} - Trainer object or null
 */
async function findByUserId(userId) {
  try {
    const query = 'SELECT * FROM trainers WHERE user_id = ?';
    const results = await executeQuery(query, [userId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all trainers with pagination
 * @param {number} limit - Limit number of results
 * @param {number} offset - Offset for pagination
 * @returns {Promise<array>} - Array of trainer objects
 */
async function getAll(limit = 10, offset = 0) {
  try {
    const query = `
      SELECT t.*, u.first_name, u.last_name, u.email
      FROM trainers t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.is_active = TRUE
      ORDER BY t.average_rating DESC
      LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(query, [limit, offset]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new trainer
 * @param {object} trainerData - { user_id, bio, specializations, certifications, hourly_rate }
 * @returns {Promise<object>} - Created trainer object
 */
async function create(trainerData) {
  try {
    const query = `
      INSERT INTO trainers (user_id, bio, specializations, certifications, hourly_rate)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      trainerData.user_id,
      trainerData.bio || null,
      trainerData.specializations || null,
      trainerData.certifications || null,
      trainerData.hourly_rate,
    ];

    const result = await executeQuery(query, values);

    return {
      trainer_id: result.insertId,
      user_id: trainerData.user_id,
      bio: trainerData.bio || null,
      specializations: trainerData.specializations || null,
      certifications: trainerData.certifications || null,
      hourly_rate: trainerData.hourly_rate,
      availability_status: 'available',
      total_classes_taught: 0,
      average_rating: 0.0,
      is_active: true,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update trainer information
 * @param {number} trainerId - Trainer ID
 * @param {object} updateData - Fields to update
 * @returns {Promise<boolean>} - True if updated
 */
async function update(trainerId, updateData) {
  try {
    const allowedFields = [
      'bio',
      'specializations',
      'certifications',
      'hourly_rate',
      'availability_status',
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

    values.push(trainerId);
    const query = `UPDATE trainers SET ${updateFields.join(', ')} WHERE trainer_id = ?`;
    const result = await executeQuery(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Deactivate trainer (soft delete)
 * @param {number} trainerId - Trainer ID
 * @returns {Promise<boolean>} - True if deactivated
 */
async function deactivate(trainerId) {
  try {
    const query = 'UPDATE trainers SET is_active = FALSE WHERE trainer_id = ?';
    const result = await executeQuery(query, [trainerId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Count total trainers
 * @returns {Promise<number>} - Total trainer count
 */
async function countTrainers() {
  try {
    const query = 'SELECT COUNT(*) as total FROM trainers WHERE is_active = TRUE';
    const results = await executeQuery(query);
    return results[0].total;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findById,
  findByUserId,
  getAll,
  create,
  update,
  deactivate,
  countTrainers,
};

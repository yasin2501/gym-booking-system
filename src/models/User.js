const { executeQuery } = require('../config/database');

/**
 * User Model
 * Handles all database queries related to users
 */

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User object or null if not found
 */
async function findByEmail(email) {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const results = await executeQuery(query, [email]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Find user by ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} - User object or null if not found
 */
async function findById(userId) {
  try {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    const results = await executeQuery(query, [userId]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new user
 * @param {object} userData - User data { email, password_hash, first_name, last_name, phone, role }
 * @returns {Promise<object>} - Created user object with user_id
 */
async function create(userData) {
  try {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name,
      userData.last_name,
      userData.phone || null,
      userData.role || 'member',
      'active',
    ];

    const result = await executeQuery(query, values);

    // Return created user
    return {
      user_id: result.insertId,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      role: userData.role || 'member',
      status: 'active',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update user last login timestamp
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if updated successfully
 */
async function updateLastLogin(userId) {
  try {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?';
    const result = await executeQuery(query, [userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all users (for admin purposes)
 * @param {number} limit - Limit number of results
 * @param {number} offset - Offset for pagination
 * @returns {Promise<array>} - Array of user objects
 */
async function getAll(limit = 10, offset = 0) {
  try {
    const query = `
      SELECT user_id, email, first_name, last_name, phone, role, status, created_at 
      FROM users 
      LIMIT ? OFFSET ?
    `;
    const results = await executeQuery(query, [limit, offset]);
    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Count total users
 * @returns {Promise<number>} - Total user count
 */
async function countUsers() {
  try {
    const query = 'SELECT COUNT(*) as total FROM users';
    const results = await executeQuery(query);
    return results[0].total;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user fields by ID
 * @param {number} userId - User ID
 * @param {object} updateData - Fields to update
 * @returns {Promise<boolean>} - True if updated
 */
async function updateById(userId, updateData) {
  try {
    const allowedFields = ['email', 'first_name', 'last_name', 'phone', 'role', 'status'];
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

    values.push(userId);
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
    const result = await executeQuery(query, values);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Deactivate user by ID (soft delete)
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if deactivated
 */
async function deactivateById(userId) {
  try {
    const query = "UPDATE users SET status = 'inactive' WHERE user_id = ?";
    const result = await executeQuery(query, [userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete user by ID (hard delete)
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if deleted
 */
async function deleteById(userId) {
  try {
    // If this user is a trainer, remove trainer-owned classes first.
    // This avoids FK RESTRICT errors on classes -> trainers when user deletion cascades to trainers.
    const trainerRows = await executeQuery('SELECT trainer_id FROM trainers WHERE user_id = ?', [userId]);
    if (trainerRows.length > 0) {
      const trainerId = trainerRows[0].trainer_id;
      await executeQuery('DELETE FROM classes WHERE trainer_id = ?', [trainerId]);
    }

    const query = 'DELETE FROM users WHERE user_id = ?';
    const result = await executeQuery(query, [userId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  findByEmail,
  findById,
  create,
  updateLastLogin,
  getAll,
  countUsers,
  updateById,
  deactivateById,
  deleteById,
};

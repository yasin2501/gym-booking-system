const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * GET /api/users
 * Admin: list all users with pagination
 */
async function getAllUsers(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const users = await User.getAll(limit, offset);
    const total = await User.countUsers();

    return res.status(200).json(
      successResponse('Users retrieved successfully', {
        users,
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
    console.error('❌ Get Users Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve users'));
  }
}

/**
 * GET /api/users/:userId
 * Admin or owner: get user profile
 */
async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (req.user.role !== 'admin' && req.user.user_id !== userId) {
      return res.status(403).json(errorResponse('Not authorized to view this user'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const safeUser = {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login: user.last_login,
    };

    return res.status(200).json(successResponse('User retrieved successfully', safeUser));
  } catch (error) {
    console.error('❌ Get User Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve user'));
  }
}

/**
 * PUT /api/users/:userId
 * Admin or owner: update user profile
 */
async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (req.user.role !== 'admin' && req.user.user_id !== userId) {
      return res.status(403).json(errorResponse('Not authorized to update this user'));
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const updateData = {
      email: req.body.email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
    };

    // Only admins can update role or status.
    if (req.user.role === 'admin') {
      if (req.body.role !== undefined) updateData.role = req.body.role;
      if (req.body.status !== undefined) updateData.status = req.body.status;
    }

    // Remove undefined values.
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updated = await User.updateById(userId, updateData);
    if (!updated) {
      return res.status(400).json(errorResponse('No valid fields to update'));
    }

    const updatedUser = await User.findById(userId);
    const safeUser = {
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
      created_at: updatedUser.created_at,
      last_login: updatedUser.last_login,
    };

    return res.status(200).json(successResponse('User updated successfully', safeUser));
  } catch (error) {
    console.error('❌ Update User Error:', error);
    return res.status(500).json(errorResponse('Failed to update user'));
  }
}

/**
 * DELETE /api/users/:userId
 * Admin only: delete user
 */
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (req.user.user_id === userId) {
      return res.status(400).json(errorResponse('Admin cannot delete own account'));
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const deleted = await User.deleteById(userId);
    if (!deleted) {
      return res.status(400).json(errorResponse('Failed to delete user'));
    }

    return res.status(200).json(successResponse('User deleted successfully'));
  } catch (error) {
    console.error('❌ Delete User Error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json(errorResponse('Cannot delete user due to related records. Remove dependent data first.'));
    }
    return res.status(500).json(errorResponse('Failed to delete user'));
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};

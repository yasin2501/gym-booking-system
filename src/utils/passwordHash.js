const bcrypt = require('bcryptjs');

/**
 * Hash a password using bcryptjs
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(password) {
  try {
    const saltRounds = 10; // Higher number = more secure but slower
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} hashedPassword - The hashed password from database
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function comparePassword(plainPassword, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
}

module.exports = {
  hashPassword,
  comparePassword,
};

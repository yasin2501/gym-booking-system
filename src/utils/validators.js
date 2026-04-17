/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a digit');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain a special character (!@#$%^&*)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate required fields
 * @param {object} obj - Object to validate
 * @param {array} fields - Required field names
 * @returns {object} - { isValid: boolean, missingFields: string[] }
 */
function validateRequiredFields(obj, fields) {
  const missingFields = fields.filter((field) => !obj[field] || obj[field].toString().trim() === '');

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequiredFields,
};

const jwt = require('jsonwebtoken');
const { setCsrfToken } = require('../middlewares/csrfProtection');

/**
 * Generate a JWT token and send it as a secure HttpOnly cookie.
 * JWT payload contains ONLY the minimum required information.
 * Also sets a double-submit CSRF cookie.
 *
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} extraData - Optional additional response payload
 */
const generateTokenAndSend = (user, statusCode, res, message, extraData = {}) => {
  // Minimal JWT payload - never include password or sensitive data
  const payload = {
    id: user._id,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  // Session Cookie options
  const cookieOptions = {
    httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };

  // Set double-submit CSRF token (cookie & header)
  const csrfToken = setCsrfToken(res);

  // Safe user object (no password, no reset token)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified === true,
    permissions: user.permissions,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      csrfToken,
      data: { user: safeUser, csrfToken, ...extraData },
      ...extraData,
    });
};

module.exports = generateTokenAndSend;

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token and send it as a secure HttpOnly cookie.
 * JWT payload contains ONLY the minimum required information.
 *
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const generateTokenAndSend = (user, statusCode, res, message) => {
  // Minimal JWT payload - never include password or sensitive data
  const payload = {
    id: user._id,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  // Cookie options
  const cookieOptions = {
    httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };

  // Safe user object (no password, no reset token)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: { user: safeUser },
    });
};

module.exports = generateTokenAndSend;

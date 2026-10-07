const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Protect middleware - verifies JWT from HttpOnly cookie.
 * Attaches the full authenticated user to req.user.
 * NEVER trusts user data from req.body for authorization.
 */
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated. Please log in.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  // Fetch fresh user from DB - verifies user still exists and gets current role
  const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User no longer exists.',
    });
  }

  // Attach authenticated user to request - this is the source of truth for authorization
  req.user = user;
  next();
});

module.exports = { protect };

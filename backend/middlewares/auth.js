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

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
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

  // Reject tokens issued before password was changed
  if (user.passwordChangedAt) {
    const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat && decoded.iat < changedTimestamp) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please log in again.',
      });
    }
  }

  // Attach authenticated user to request - this is the source of truth for authorization
  req.user = user;
  next();
});

/**
 * Middleware ensuring user has verified their email address before proceeding.
 * Admins and subadmins bypass this check.
 */
const requireVerifiedEmail = (req, res, next) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'subadmin';
  if (!isAdmin && req.user?.emailVerified === false) {
    return res.status(403).json({
      success: false,
      requiresEmailVerification: true,
      message: 'Please verify your email before adding a business',
    });
  }
  next();
};

/**
 * Optional Auth middleware - verifies JWT from HttpOnly cookie if present.
 * If valid, attaches user to req.user.
 * If absent or invalid, sets req.user = null and continues without failing.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    req.user = null;
    return next();
  }

  if (!process.env.JWT_SECRET) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

    if (user) {
      if (user.passwordChangedAt) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat && decoded.iat < changedTimestamp) {
          req.user = null;
          return next();
        }
      }
      req.user = user;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  next();
});

module.exports = { protect, optionalAuth, requireVerifiedEmail };

const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateTokenAndSend = require('../utils/generateToken');
const cloudinary = require('../config/cloudinary');
const {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../utils/validators');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = [
  ...registerValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user - password hashed by pre-save hook
    const user = await User.create({ name, email, password });

    // Send token in cookie
    generateTokenAndSend(user, 201, res, 'Account created successfully. Welcome!');
  }),
];

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = [
  ...loginValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, password } = req.body;

    // Need password for comparison - use .select('+password')
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    generateTokenAndSend(user, 200, res, 'Logged in successfully.');
  }),
];

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res
    .status(200)
    .cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Immediately expire
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })
    .json({
      success: true,
      message: 'Logged out successfully.',
    });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware with fresh DB data
  res.status(200).json({
    success: true,
    message: 'User retrieved successfully.',
    data: { user: req.user },
  });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = [
  ...forgotPasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token (raw token returned, hashed token stored in DB)
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a real app, you would send this token via email
    // For now, we return it in development to enable testing
    // In production, integrate a mail service like Nodemailer + Gmail/SendGrid
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    console.log('🔑 Password reset URL (dev only):', resetUrl);

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      // NEVER expose token in production - this is dev-only for testing
      ...(process.env.NODE_ENV === 'development' && { devResetUrl: resetUrl }),
    });
  }),
];

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = [
  ...resetPasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { token, password } = req.body;

    // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token must not be expired
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Set new password - hashing done by pre-save hook
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    generateTokenAndSend(user, 200, res, 'Password reset successfully. You are now logged in.');
  }),
];

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────
const changePassword = [
  ...changePasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { currentPassword, newPassword } = req.body;

    // Fetch user with password for verification
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.',
      });
    }

    user.password = newPassword;
    await user.save();

    // Re-issue token with fresh cookie
    generateTokenAndSend(user, 200, res, 'Password changed successfully.');
  }),
];

// ─── PATCH /api/auth/update-profile ──────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  // Only allow safe fields - NEVER allow role or isApproved from body
  const allowedFields = ['name', 'email'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (req.file) {
    // Delete old avatar from Cloudinary if it exists
    if (req.user.avatar?.publicId) {
      await cloudinary.uploader.destroy(req.user.avatar.publicId);
    }
    updates.avatar = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};

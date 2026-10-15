const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateTokenAndSend = require('../utils/generateToken');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');
const { getWelcomeEmailHtml, getPasswordResetEmailHtml } = require('../utils/emailTemplates');
const {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} = require('../utils/validators');

// ─── Resolve active frontend URL safely ───────────────────────────────────────
const getFrontendUrl = (req) => {
  // 1. Prefer request Origin header if provided by browser
  try {
    const origin = req?.headers?.origin || (req?.headers?.referer ? new URL(req.headers.referer).origin : null);
    if (origin && !origin.includes('pkbizmap-com.vercel.app')) {
      return origin.replace(/\/$/, '');
    }
  } catch (e) {}

  // 2. Use FRONTEND_URL environment variable (ignore stale deleted deployment)
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl && !envUrl.includes('pkbizmap-com.vercel.app')) {
    return envUrl.replace(/\/$/, '');
  }

  // 3. Fallback to active live frontend
  return 'https://bizprimehub.vercel.app';
};

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

    // Welcome Email: awaited before responding so serverless functions (Vercel)
    // do not freeze execution before SMTP transmission finishes.
    // sendEmail is safe and never throws, so signup will NEVER fail or block.
    try {
      const frontendUrl = getFrontendUrl(req);
      const loginUrl = `${frontendUrl}/login`;
      await sendEmail({
        to: user.email,
        subject: 'Welcome to BizPrimeHub!',
        html: getWelcomeEmailHtml({ name: user.name, loginUrl }),
      }).catch((err) => {
        console.error('⚠️ [Auth:Register] Non-fatal error sending welcome email:', err.message);
      });
    } catch (e) {
      console.error('⚠️ [Auth:Register] Unexpected error setting up welcome email:', e.message);
    }

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

    // Always return generic success response to prevent email enumeration attacks
    const genericResponse = {
      success: true,
      message: 'If this email is registered, a reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate reset token (raw token returned, hashed token + 1-hour expiry stored in DB)
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = getFrontendUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send reset email: awaited before response so Vercel serverless environment does not freeze
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your BizPrimeHub Password',
        html: getPasswordResetEmailHtml({ name: user.name, resetUrl }),
      }).catch((err) => {
        console.error('⚠️ [Auth:ForgotPassword] Error sending reset email:', err.message);
      });
    } catch (e) {
      console.error('⚠️ [Auth:ForgotPassword] Unexpected error sending reset email:', e.message);
    }

    res.status(200).json(genericResponse);
  }),
];

// ─── POST /api/auth/reset-password/:token (and POST /api/auth/reset-password) ─
const resetPassword = [
  ...resetPasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const token = req.params?.token || req.body?.token;
    const newPassword = req.body?.newPassword || req.body?.password;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing reset token.',
      });
    }

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
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
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
const updateProfile = [
  ...updateProfileValidator,
  asyncHandler(async (req, res) => {
    validate(req);

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
}),
];

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

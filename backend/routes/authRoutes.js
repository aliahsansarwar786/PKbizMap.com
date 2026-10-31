const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendOtp,
  updateEmail,
  correctEmail,
  login,
  logout,
  getMe,
  getCsrfToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { handleAvatarUpload } = require('../middlewares/upload');
const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/otpManager');
const createRateLimitStore = require('../utils/upstashStore');

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('auth'),
});

// Public routes
router.get('/csrf-token', getCsrfToken);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
// POST /api/auth/correct-email
router.post('/correct-email', authLimiter, correctEmail);
router.post('/login', login);

// Password reset OTP flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/resend-reset-otp', resendResetOtp);

// Protected routes (require authentication)
router.patch('/email', protect, updateEmail);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);
router.patch('/update-profile', protect, handleAvatarUpload, updateProfile);

module.exports = router;

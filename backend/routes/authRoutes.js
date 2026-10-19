const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  resendOtp,
  updateEmail,
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

// Public routes
router.get('/csrf-token', getCsrfToken);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
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

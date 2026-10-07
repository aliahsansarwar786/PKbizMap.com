const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { handleAvatarUpload } = require('../middlewares/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);
router.patch('/update-profile', protect, handleAvatarUpload, updateProfile);

module.exports = router;

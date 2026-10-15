const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  getAllBusinesses,
  getPendingBusinesses,
  getAdminBusinessById,
  approveBusiness,
  rejectBusiness,
  adminDeleteBusiness,
  updateUserRole,
  deleteUser,
  getAllReviews,
  adminDeleteReview,
  adminUpdateBusiness,
  getPaymentHistory,
  deleteBusinessReceipt,
  migrateLocations,
} = require('../controllers/adminController');
const {
  updatePaymentSettings,
  deletePaymentQrCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
} = require('../controllers/settingController');
const { handleQrCodeUpload, handlePaymentCardImageUpload } = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

// All admin routes require authentication AND admin role
// protect: verifies JWT from cookie
// authorize('admin'): verifies role from DB, never from body
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Payment Settings (Raast QR Code & Gateway)
router.patch('/settings/payment', handleQrCodeUpload, updatePaymentSettings);
router.delete('/settings/payment/qr', deletePaymentQrCode);

// Configurable Payment Method Cards (Admin only)
router.post('/settings/payment/methods', handlePaymentCardImageUpload, createPaymentMethod);
router.patch('/settings/payment/methods/:methodId', handlePaymentCardImageUpload, updatePaymentMethod);
router.delete('/settings/payment/methods/:methodId', deletePaymentMethod);
router.patch('/settings/payment/methods/:methodId/toggle', togglePaymentMethod);

// Payments History
router.get('/payments', getPaymentHistory);

// Users
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Businesses - specific before parameterized
router.get('/businesses/pending', getPendingBusinesses);
router.get('/businesses', getAllBusinesses);
router.get('/businesses/:id', getAdminBusinessById);
router.patch('/businesses/:id', adminUpdateBusiness);
router.patch('/businesses/:id/approve', approveBusiness);
router.patch('/businesses/:id/reject', rejectBusiness);
router.delete('/businesses/:id', adminDeleteBusiness);
router.delete('/businesses/:id/receipt', deleteBusinessReceipt);
router.post('/migrate-locations', migrateLocations);

// Reviews
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', adminDeleteReview);

module.exports = router;

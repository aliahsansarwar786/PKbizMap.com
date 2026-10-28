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
  updateUserPermissions,
  deleteUser,
  getAllReviews,
  adminDeleteReview,
  adminUpdateBusiness,
  getPaymentHistory,
  deleteBusinessReceipt,
  updateBusinessPaymentStatus,
  getClaimRequests,
  approveClaimRequest,
  rejectClaimRequest,
  spamUser,
  unspamUser,
  getEmailStats,
  getEmailLog,
  sendAdminEmail,
  getActivityLog,
  exportBackup,
  getQuota,
} = require('../controllers/adminController');
const {
  getPaymentSettings,
  updatePaymentSettings,
  deletePaymentQrCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
} = require('../controllers/settingController');
const { handleQrCodeUpload, handlePaymentCardImageUpload } = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const { authorize, checkPermission } = require('../middlewares/authorize');

// Protect all admin routes: requires authenticated admin or subadmin
router.use(protect);
router.use(authorize('admin', 'subadmin'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', checkPermission('canApproveListings'), getDashboard);

// ─── Payment Settings & Methods (Main Admin ONLY) ────────────────────────────
router.get('/settings/payment', authorize('admin'), getPaymentSettings);
router.patch('/settings/payment', authorize('admin'), handleQrCodeUpload, updatePaymentSettings);
router.delete('/settings/payment/qr', authorize('admin'), deletePaymentQrCode);

router.post('/settings/payment/methods', authorize('admin'), handlePaymentCardImageUpload, createPaymentMethod);
router.patch('/settings/payment/methods/:methodId', authorize('admin'), handlePaymentCardImageUpload, updatePaymentMethod);
router.delete('/settings/payment/methods/:methodId', authorize('admin'), deletePaymentMethod);
router.patch('/settings/payment/methods/:methodId/toggle', authorize('admin'), togglePaymentMethod);

// ─── Payments History & Verification (Main Admin ONLY) ───────────────────────
router.get('/payments', authorize('admin'), getPaymentHistory);
router.patch('/businesses/:id/payment', authorize('admin'), updateBusinessPaymentStatus);

// ─── User Management & Permissions (Main Admin ONLY) ─────────────────────────
router.get('/users', authorize('admin'), getUsers);
router.patch('/users/:id/role', authorize('admin'), updateUserRole);
router.patch('/users/:id/permissions', authorize('admin'), updateUserPermissions);
router.patch('/users/:id/spam', authorize('admin'), spamUser);
router.patch('/users/:id/unspam', authorize('admin'), unspamUser);
router.delete('/users/:id', authorize('admin'), deleteUser);

// ─── Email Management & Logs (Main Admin ONLY) ────────────────────────────────
router.get('/emails/stats', authorize('admin'), getEmailStats);
router.get('/emails/log', authorize('admin'), getEmailLog);
router.post('/emails/send', authorize('admin'), sendAdminEmail);

// ─── Activity Log (Main Admin ONLY) ──────────────────────────────────────────
router.get('/activity-log', authorize('admin'), getActivityLog);

// ─── Export / Backup (Main Admin ONLY) ────────────────────────────────────────
router.get('/export', authorize('admin'), exportBackup);

// ─── Quota Stats (Main Admin ONLY) ───────────────────────────────────────────
router.get('/quota', authorize('admin'), getQuota);

// ─── Businesses Management (Permission controlled) ────────────────────────────
router.get('/businesses/pending', checkPermission('canApproveListings'), getPendingBusinesses);
router.get('/businesses', checkPermission('canApproveListings'), getAllBusinesses);
router.get('/businesses/:id', checkPermission('canApproveListings'), getAdminBusinessById);
router.patch('/businesses/:id', checkPermission('canApproveListings'), adminUpdateBusiness);
router.patch('/businesses/:id/approve', checkPermission('canApproveListings'), approveBusiness);
router.patch('/businesses/:id/reject', checkPermission('canApproveListings'), rejectBusiness);
router.delete('/businesses/:id', checkPermission('canDeleteListings'), adminDeleteBusiness);
router.delete('/businesses/:id/receipt', checkPermission('canDeleteListings'), deleteBusinessReceipt);

// ─── Reviews Management (Permission controlled) ──────────────────────────────
router.get('/reviews', checkPermission('canModerateReviews'), getAllReviews);
router.delete('/reviews/:id', checkPermission('canModerateReviews'), adminDeleteReview);

// ─── Claim Requests Management ────────────────────────────────────────────────
router.get('/claims', checkPermission('canApproveListings'), getClaimRequests);
router.patch('/claims/:id/approve', checkPermission('canApproveListings'), approveClaimRequest);
router.patch('/claims/:id/reject', checkPermission('canApproveListings'), rejectClaimRequest);

module.exports = router;

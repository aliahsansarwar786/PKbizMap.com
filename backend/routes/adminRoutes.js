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
} = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

// All admin routes require authentication AND admin role
// protect: verifies JWT from cookie
// authorize('admin'): verifies role from DB, never from body
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Businesses - specific before parameterized
router.get('/businesses/pending', getPendingBusinesses);
router.get('/businesses', getAllBusinesses);
router.get('/businesses/:id', getAdminBusinessById);
router.patch('/businesses/:id/approve', approveBusiness);
router.patch('/businesses/:id/reject', rejectBusiness);
router.delete('/businesses/:id', adminDeleteBusiness);

// Reviews
router.get('/reviews', getAllReviews);

module.exports = router;

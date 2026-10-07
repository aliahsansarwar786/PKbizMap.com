const User = require('../models/User');
const Business = require('../models/Business');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const { validate, objectIdValidator } = require('../utils/validators');

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
// Admin: Application statistics
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    totalReviews,
    recentBusinesses,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    Business.countDocuments(),
    Business.countDocuments({ isApproved: false }),
    Business.countDocuments({ isApproved: true }),
    Review.countDocuments(),
    Business.find().sort('-createdAt').limit(5).populate('owner', 'name email').lean(),
    User.find().sort('-createdAt').limit(5).lean(),
  ]);

  // Storage Stats
  const mongoose = require('mongoose');
  let dbSizeMB = 0;
  try {
    const dbStats = await mongoose.connection.db.stats();
    dbSizeMB = (dbStats.storageSize / (1024 * 1024)).toFixed(2);
  } catch (err) {}

  const dbLimitMB = 512; // Mongo M0 Free Tier
  const MAX_BUSINESSES = 2000;

  // Cloudinary Stats
  let cloudinaryUsage = { usedCredits: 0, maxCredits: 25, percentage: 0 };
  try {
    const usage = await cloudinary.api.usage();
    if (usage && usage.credits) {
      cloudinaryUsage.usedCredits = Math.max(0, usage.credits.usage);
      cloudinaryUsage.maxCredits = usage.credits.limit;
      cloudinaryUsage.percentage = Math.max(0, usage.credits.used_percent);
    }
  } catch (err) {
    console.error("Cloudinary usage fetch error:", err);
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved.',
    data: {
      stats: {
        totalUsers,
        totalBusinesses,
        pendingBusinesses,
        approvedBusinesses,
        totalReviews,
        limits: {
          businesses: {
            used: totalBusinesses,
            max: MAX_BUSINESSES,
            percentage: ((totalBusinesses / MAX_BUSINESSES) * 100).toFixed(1),
          },
          database: {
            usedMB: dbSizeMB,
            maxMB: dbLimitMB,
            percentage: ((dbSizeMB / dbLimitMB) * 100).toFixed(1),
          },
          cloudinary: {
            usedCredits: cloudinaryUsage.usedCredits,
            maxCredits: cloudinaryUsage.maxCredits,
            percentage: cloudinaryUsage.percentage.toFixed(1),
          }
        }
      },
      recentBusinesses,
      recentUsers,
    },
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Admin: Get all users with pagination
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (role && ['user', 'admin'].includes(role)) {
    queryObj.role = role;
  }
  if (search && search.trim()) {
    queryObj.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(queryObj).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    User.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully.',
    data: {
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

// ─── GET /api/admin/businesses ────────────────────────────────────────────────
// Admin: Get all businesses (approved + unapproved)
const getAllBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isApproved, category, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (isApproved !== undefined && isApproved !== '') {
    queryObj.isApproved = isApproved === 'true';
  }
  if (category && category.trim()) {
    queryObj.category = category.trim();
  }
  if (search && search.trim()) {
    queryObj.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { 'address.city': { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [businesses, total] = await Promise.all([
    Business.find(queryObj)
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Businesses retrieved successfully.',
    data: {
      businesses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

// ─── GET /api/admin/businesses/pending ────────────────────────────────────────
// Admin: Get pending businesses specifically
const getPendingBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [businesses, total] = await Promise.all([
    Business.find({ isApproved: false })
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments({ isApproved: false }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Pending businesses retrieved successfully.',
    data: {
      businesses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

// ─── PATCH /api/admin/businesses/:id/approve ──────────────────────────────────
// Admin: Approve a business listing
const approveBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    res.status(200).json({
      success: true,
      message: `"${business.title}" has been approved and is now publicly visible.`,
      data: { business },
    });
  }),
];

// ─── PATCH /api/admin/businesses/:id/reject ───────────────────────────────────
// Admin: Reject a business listing (keeps it in DB as unapproved)
const rejectBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    res.status(200).json({
      success: true,
      message: `"${business.title}" has been rejected.`,
      data: { business },
    });
  }),
];

// ─── DELETE /api/admin/businesses/:id ────────────────────────────────────────
// Admin: Hard delete any business
const adminDeleteBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Delete all Cloudinary images
    const deletePromises = business.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch((err) => {
        console.error(`Failed to delete image ${img.publicId}:`, err.message);
      })
    );
    await Promise.all(deletePromises);

    // Delete all reviews
    await Review.deleteMany({ business: business._id });
    await Business.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Business and all associated data deleted successfully.',
    });
  }),
];

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
// Admin: Change a user's role
const updateUserRole = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin".',
      });
    }

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to "${role}" successfully.`,
      data: { user },
    });
  }),
];

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Admin: Delete a user and all their data
const deleteUser = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete user's avatar from Cloudinary
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId).catch((err) => {
        console.error('Failed to delete avatar:', err.message);
      });
    }

    // Delete user's businesses and their images
    const userBusinesses = await Business.find({ owner: req.params.id });
    for (const business of userBusinesses) {
      for (const img of business.images) {
        await cloudinary.uploader.destroy(img.publicId).catch((err) => {
          console.error(`Failed to delete image ${img.publicId}:`, err.message);
        });
      }
    }
    await Business.deleteMany({ owner: req.params.id });

    // Delete user's reviews
    await Review.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.',
    });
  }),
];

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────
// Admin: Get all reviews
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('user', 'name email')
      .populate('business', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Reviews retrieved successfully.',
    data: {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

module.exports = {
  getDashboard,
  getUsers,
  getAllBusinesses,
  getPendingBusinesses,
  approveBusiness,
  rejectBusiness,
  adminDeleteBusiness,
  updateUserRole,
  deleteUser,
  getAllReviews,
};

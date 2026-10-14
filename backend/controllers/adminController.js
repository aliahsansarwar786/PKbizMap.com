const User = require('../models/User');
const Business = require('../models/Business');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const escapeRegex = require('../utils/escapeRegex');
const { validate, objectIdValidator, updateBusinessValidator } = require('../utils/validators');

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
    const safeSearch = escapeRegex(search.trim());
    queryObj.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
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
  const { page = 1, limit = 20, isApproved, category, country, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const andConditions = [];
  if (isApproved !== undefined && isApproved !== '') {
    andConditions.push({ isApproved: isApproved === 'true' });
  }
  if (category && category.trim()) {
    andConditions.push({ category: category.trim() });
  }
  if (country && country.trim() && country.trim().toLowerCase() !== 'all') {
    const c = country.trim();
    if (c.toLowerCase() === 'pakistan') {
      // Include explicit Pakistan OR legacy records where country is missing/null/empty
      andConditions.push({
        $or: [
          { 'address.country': 'Pakistan' },
          { 'address.country': { $exists: false } },
          { 'address.country': null },
          { 'address.country': '' },
        ],
      });
    } else {
      // For UAE, USA, or other: strict match only
      andConditions.push({ 'address.country': c });
    }
  }
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    andConditions.push({
      $or: [
        { title: { $regex: safeSearch, $options: 'i' } },
        { 'address.city': { $regex: safeSearch, $options: 'i' } },
      ],
    });
  }

  const queryObj = andConditions.length > 1 ? { $and: andConditions } : (andConditions[0] || {});

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

    // Delete all Cloudinary images and receipt
    const deletePromises = business.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch((err) => {
        console.error(`Failed to delete image ${img.publicId}:`, err.message);
      })
    );
    if (business.paymentReceipt?.publicId) {
      deletePromises.push(
        cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
          console.error(`Failed to delete receipt ${business.paymentReceipt.publicId}:`, err.message);
        })
      );
    }
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
// Admin: Get all reviews with search and pagination
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (search && search.trim()) {
    queryObj.comment = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  const [reviews, total] = await Promise.all([
    Review.find(queryObj)
      .populate('user', 'name email')
      .populate('business', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(queryObj),
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

// ─── DELETE /api/admin/reviews/:id ───────────────────────────────────────────
// Admin: Delete a review (triggers post findOneAndDelete hook to recalc ratings)
const adminDeleteReview = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully and ratings updated.',
    });
  }),
];

// ─── PATCH /api/admin/businesses/:id ─────────────────────────────────────────
// Admin: Edit a business's core details without resetting approval or payment
const adminUpdateBusiness = [
  ...objectIdValidator('id'),
  ...updateBusinessValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Allowed fields ONLY: title, description, category, email, phone, website, address
    const allowedScalarFields = ['title', 'description', 'category', 'email', 'phone', 'website'];
    allowedScalarFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    });

    if (req.body.address && typeof req.body.address === 'object') {
      if (req.body.address.country !== undefined) business.address.country = req.body.address.country;
      if (req.body.address.street !== undefined) business.address.street = req.body.address.street;
      if (req.body.address.city !== undefined) business.address.city = req.body.address.city;
      if (req.body.address.zipCode !== undefined) business.address.zipCode = req.body.address.zipCode;
    } else {
      if (req.body.country !== undefined) business.address.country = req.body.country;
      if (req.body.street !== undefined) business.address.street = req.body.street;
      if (req.body.city !== undefined) business.address.city = req.body.city;
      if (req.body.zipCode !== undefined) business.address.zipCode = req.body.zipCode;
    }

    // FORBIDDEN fields: owner, isApproved, averageRating, reviewCount, paymentReceipt, paymentStatus, paymentAmount, images
    // None of these are modified.
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Business updated successfully by admin.',
      data: { business },
    });
  }),
];

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
// Admin: Get payment history for listings with payment receipts
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, paymentStatus, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {
    'paymentReceipt.url': { $exists: true, $ne: '' },
  };

  if (paymentStatus && ['none', 'pending', 'verified', 'rejected'].includes(paymentStatus)) {
    queryObj.paymentStatus = paymentStatus;
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ],
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    queryObj.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { owner: { $in: userIds } },
    ];
  }

  const [payments, total] = await Promise.all([
    Business.find(queryObj)
      .select('_id title owner paymentAmount paymentStatus paymentReceipt.url createdAt isApproved')
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Payment history retrieved successfully.',
    data: {
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

// ─── GET /api/admin/businesses/:id ──────────────────────────────────────────
// Admin: Get single business by ID (even if unapproved)
const getAdminBusinessById = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Business retrieved successfully.',
      data: { business },
    });
  }),
];

// ─── DELETE /api/admin/businesses/:id/receipt ────────────────────────────────
// Admin: Delete a business's uploaded payment receipt
const deleteBusinessReceipt = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (business.paymentReceipt?.publicId) {
      await cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
        console.error('Failed to delete receipt from Cloudinary:', err.message);
      });
    }

    business.paymentReceipt = { url: '', publicId: '' };
    business.paymentStatus = 'none';
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Payment receipt deleted successfully.',
      data: { business },
    });
  }),
];

// ─── POST /api/admin/migrate-locations ───────────────────────────────────────
// Admin: One-time migration to set address.country = 'Pakistan' & fix typos
const migrateLocations = asyncHandler(async (req, res) => {
  const locationsData = require('../data/locations.json');
  const pakistanCities = (locationsData.Pakistan || []).map((c) => c.toLowerCase());

  // 1. Fix typo 'multsn' -> 'Multan'
  const typoResult = await Business.updateMany(
    { 'address.city': { $regex: /^multsn$/i } },
    { $set: { 'address.city': 'Multan' } }
  );

  // 2. Find businesses where address.country is missing / null / empty
  const businesses = await Business.find({
    $or: [
      { 'address.country': { $exists: false } },
      { 'address.country': null },
      { 'address.country': '' },
    ],
  });

  let updatedCount = 0;
  for (const b of businesses) {
    const city = (b.address?.city || '').trim().toLowerCase();
    if (pakistanCities.includes(city) || city === 'multan' || city === 'multsn') {
      b.address = b.address || {};
      b.address.country = 'Pakistan';
      if (city === 'multsn') b.address.city = 'Multan';
      await b.save({ validateBeforeSave: false });
      updatedCount++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Locations migration finished. Fixed ${typoResult.modifiedCount || 0} typo(s) and updated ${updatedCount} business(es).`,
    data: {
      typoFixedCount: typoResult.modifiedCount || 0,
      countryUpdatedCount: updatedCount,
    },
  });
});

module.exports = {
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
};

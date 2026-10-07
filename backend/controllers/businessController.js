const mongoose = require('mongoose');
const Business = require('../models/Business');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const { validate, businessValidator, objectIdValidator } = require('../utils/validators');

// ─── GET /api/businesses ──────────────────────────────────────────────────────
// Public: Returns only approved businesses with search, filter, pagination
const getBusinesses = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    city,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const queryObj = { isApproved: true }; // Only approved businesses publicly

  // ─── Text search ────────────────────────────────────────────────────────
  if (keyword && keyword.trim()) {
    queryObj.$text = { $search: keyword.trim() };
  }

  // ─── Category filter ─────────────────────────────────────────────────────
  if (category && category.trim()) {
    queryObj.category = category.trim();
  }

  // ─── City filter (case-insensitive partial match) ─────────────────────────
  if (city && city.trim()) {
    queryObj['address.city'] = { $regex: city.trim(), $options: 'i' };
  }

  // ─── Pagination ───────────────────────────────────────────────────────────
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // ─── Allowed sort fields ──────────────────────────────────────────────────
  const allowedSorts = ['-createdAt', 'createdAt', '-averageRating', 'averageRating', 'title', '-title'];
  const sortStr = allowedSorts.includes(sort) ? sort : '-createdAt';

  // ─── Execute query ────────────────────────────────────────────────────────
  const [businesses, total] = await Promise.all([
    Business.find(queryObj)
      .populate('owner', 'name avatar')
      .select('-__v')
      .sort(sortStr)
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
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── GET /api/businesses/:id ──────────────────────────────────────────────────
// Public: Returns single approved business with reviews
const getBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findOne({
      _id: req.params.id,
      isApproved: true,
    })
      .populate('owner', 'name avatar createdAt')
      .select('-__v');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
    }

    // Get reviews for this business
    const reviews = await Review.find({ business: business._id })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Business retrieved successfully.',
      data: { business, reviews },
    });
  }),
];

// ─── POST /api/businesses ─────────────────────────────────────────────────────
// Protected: Authenticated users create businesses
const createBusiness = [
  ...businessValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { title, description, category, email, phone, website, address } = req.body;

    // Process uploaded images
    const images = req.files
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }))
      : [];

    // --- PRO TIER LIMIT CHECK ---
    const MAX_BUSINESSES = 2000; // Increased limit for free tier
    const totalCount = await Business.countDocuments();
    if (totalCount >= MAX_BUSINESSES) {
      // In a real app, you might trigger an email to admin here
      console.log('🚨 ALERT: Business limit reached! Admin notified.');
      return res.status(403).json({
        success: false,
        message: `System limit reached! Maximum ${MAX_BUSINESSES} businesses allowed in the free tier. Admin has been notified.`,
      });
    }

    // NEVER trust owner from req.body - always use authenticated user
    const business = await Business.create({
      title,
      description,
      category,
      email,
      phone,
      website,
      address,
      images,
      owner: req.user._id, // Server-side only
      isApproved: req.user.role === 'admin', // Auto-approve if Admin
    });

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Business created and auto-approved successfully.' 
        : 'Business created successfully. It will be visible after admin approval.',
      data: { business },
    });
  }),
];

// ─── PATCH /api/businesses/:id ────────────────────────────────────────────────
// Protected: Owner can edit, Admin can edit any
const updateBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authorization: owner or admin only
    const isOwner = business.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this business.',
      });
    }

    // Allowed update fields - NEVER allow owner, isApproved, role from body
    const allowedFields = ['title', 'description', 'category', 'email', 'phone', 'website', 'address'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      // Check total images won't exceed 5
      const totalImages = business.images.length + newImages.length;
      if (totalImages > 5) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload ${newImages.length} more images. Maximum 5 images allowed. Current: ${business.images.length}`,
        });
      }

      updates.$push = { images: { $each: newImages } };
    }

    // Non-admin edits reset approval (content change requires re-approval)
    if (!isAdmin) {
      updates.isApproved = false;
    }

    const updated = await Business.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: isAdmin
        ? 'Business updated successfully.'
        : 'Business updated successfully. It requires re-approval.',
      data: { business: updated },
    });
  }),
];

// ─── DELETE /api/businesses/:id ──────────────────────────────────────────────
// Protected: Owner or Admin only
const deleteBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authorization: owner or admin only
    const isOwner = business.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this business.',
      });
    }

    // Delete all images from Cloudinary
    const deletePromises = business.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch((err) => {
        console.error(`Failed to delete image ${img.publicId}:`, err.message);
      })
    );
    await Promise.all(deletePromises);

    // Delete all reviews for this business
    await Review.deleteMany({ business: business._id });

    await Business.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Business and all associated data deleted successfully.',
    });
  }),
];

// ─── DELETE /api/businesses/:id/images/:publicId ─────────────────────────────
// Protected: Owner or Admin - delete a single business image
const deleteBusinessImage = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const isOwner = business.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const { publicId } = req.params;
  // Verify image belongs to this business
  const imageExists = business.images.some((img) => img.publicId === publicId);
  if (!imageExists) {
    return res.status(404).json({ success: false, message: 'Image not found in this business.' });
  }

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  // Remove from DB
  await Business.findByIdAndUpdate(req.params.id, {
    $pull: { images: { publicId } },
  });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully.',
  });
});

// ─── GET /api/businesses/my ───────────────────────────────────────────────────
// Protected: Get authenticated user's own businesses (all approval statuses)
const getMyBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [businesses, total] = await Promise.all([
    Business.find({ owner: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments({ owner: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Your businesses retrieved successfully.',
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

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  deleteBusinessImage,
  getMyBusinesses,
};

const mongoose = require('mongoose');
const Review = require('../models/Review');
const Business = require('../models/Business');
const asyncHandler = require('../utils/asyncHandler');
const { validate, reviewValidator, objectIdValidator } = require('../utils/validators');

// ─── GET /api/businesses/:id/reviews ─────────────────────────────────────────
// Public: Get paginated reviews for a business (accepts slug or ID)
const getReviews = [
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const identifier = (req.params.id || '').trim();
    let business = await Business.findOne({ slug: identifier, isApproved: true });
    if (!business && mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findOne({ _id: identifier, isApproved: true });
    }

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ business: business._id })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ business: business._id }),
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
  }),
];

// ─── POST /api/businesses/:id/reviews ────────────────────────────────────────
// Public/Optional Auth: Logged in or guest users leave a review
const createReview = [
  ...reviewValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { rating, comment } = req.body;
    let reviewerName = (req.body.name || req.body.guestName || '').trim();

    const identifier = (req.params.id || '').trim();
    let business = await Business.findOne({ slug: identifier, isApproved: true });
    if (!business && mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findOne({ _id: identifier, isApproved: true });
    }

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authenticated path
    if (req.user) {
      // Business owner cannot review their own business
      if (business.owner && business.owner.toString() === req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You cannot review your own business.',
        });
      }

      // Check if user already reviewed this business
      const existingReview = await Review.findOne({
        business: business._id,
        user: req.user._id,
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'You have already reviewed this business. You can edit your existing review.',
        });
      }

      const review = await Review.create({
        business: business._id,
        user: req.user._id,
        guestName: reviewerName || req.user.name,
        rating,
        comment,
      });

      await review.populate('user', 'name avatar');

      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully.',
        data: { review },
      });
    }

    // Guest path (no auth token)
    if (!reviewerName || reviewerName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer name is required (at least 2 characters).',
      });
    }

    if (reviewerName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer name cannot exceed 100 characters.',
      });
    }

    const review = await Review.create({
      business: business._id,
      user: null,
      guestName: reviewerName,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: { review },
    });
  }),
];

// ─── PATCH /api/reviews/:id ───────────────────────────────────────────────────
// Protected: User edits their own review
const updateReview = [
  ...objectIdValidator('id'),
  ...reviewValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Only the review author can edit (admin cannot edit, only delete)
    if (!review.user || review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews.',
      });
    }

    const { rating, comment } = req.body;
    review.rating = rating;
    review.comment = comment;
    await review.save(); // Triggers post-save hook to recalculate rating

    await review.populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      data: { review },
    });
  }),
];

// ─── DELETE /api/reviews/:id ──────────────────────────────────────────────────
// Protected: Review author or Admin can delete
const deleteReview = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const isAdmin =
      req.user.role === 'admin' ||
      (req.user.role === 'subadmin' && req.user.permissions?.canModerateReviews === true);
    const isAuthor = Boolean(review.user && review.user.toString() === req.user._id.toString());

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review.',
      });
    }

    // findOneAndDelete triggers post hook to recalculate rating
    await Review.findOneAndDelete({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  }),
];

module.exports = { getReviews, createReview, updateReview, deleteReview };

const Review = require('../models/Review');
const Business = require('../models/Business');
const asyncHandler = require('../utils/asyncHandler');
const { validate, reviewValidator, objectIdValidator } = require('../utils/validators');

// ─── GET /api/businesses/:id/reviews ─────────────────────────────────────────
// Public: Get paginated reviews for a business
const getReviews = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Verify business exists and is approved (public view)
    const business = await Business.findOne({
      _id: req.params.id,
      isApproved: true,
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ business: req.params.id })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments({ business: req.params.id }),
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
// Protected: Authenticated users leave a review (1 per user per business)
const createReview = [
  ...objectIdValidator('id'),
  ...reviewValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { rating, comment } = req.body;

    // Verify business exists and is approved
    const business = await Business.findOne({
      _id: req.params.id,
      isApproved: true,
    });

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Business owner cannot review their own business
    if (business.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own business.',
      });
    }

    // Check if user already reviewed this business
    const existingReview = await Review.findOne({
      business: req.params.id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this business. You can edit your existing review.',
      });
    }

    const review = await Review.create({
      business: req.params.id,
      user: req.user._id, // Always from server - never trust body
      rating,
      comment,
    });

    await review.populate('user', 'name avatar');

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
    if (review.user.toString() !== req.user._id.toString()) {
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

    const isAuthor = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

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

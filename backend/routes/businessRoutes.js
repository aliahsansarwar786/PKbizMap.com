const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/otpManager');
const {
  getBusinesses,
  getBusiness,
  getBusinessSummary,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  deleteBusinessImage,
  getMyBusinesses,
} = require('../controllers/businessController');
const { getReviews, createReview } = require('../controllers/reviewController');
const { requestClaim } = require('../controllers/claimController');
const { protect, optionalAuth, requireVerifiedEmail } = require('../middlewares/auth');
const { handleBusinessImageUpload } = require('../middlewares/upload');

// Rate limiter for reviews: max 5 reviews per hour per IP
const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: 'Too many reviews submitted from this IP address. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for claims: max 5 claims per hour per IP
const claimRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: 'Too many claim requests submitted from this IP address. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/', getBusinesses);

// IMPORTANT: specific routes BEFORE parameterized routes
router.get('/summary', getBusinessSummary);
router.get('/my', protect, getMyBusinesses);

router.get('/:id', getBusiness);
router.get('/:id/reviews', getReviews);

// Claim listing request (public with per-IP rate limiting)
router.post('/:id/claim', claimRateLimiter, requestClaim);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.post('/', protect, requireVerifiedEmail, handleBusinessImageUpload, createBusiness);
router.patch('/:id', protect, handleBusinessImageUpload, updateBusiness);
router.delete('/:id', protect, deleteBusiness);
router.delete('/:id/images/:publicId', protect, deleteBusinessImage);

// Reviews (nested under businesses) - accepts guest or logged-in users with IP rate limiting
router.post('/:id/reviews', reviewRateLimiter, optionalAuth, createReview);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  deleteBusinessImage,
  getMyBusinesses,
} = require('../controllers/businessController');
const { getReviews, createReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const { handleBusinessImageUpload } = require('../middlewares/upload');

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/', getBusinesses);

// IMPORTANT: specific routes BEFORE parameterized routes
router.get('/my', protect, getMyBusinesses);

router.get('/:id', getBusiness);
router.get('/:id/reviews', getReviews);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.post('/', protect, handleBusinessImageUpload, createBusiness);
router.patch('/:id', protect, handleBusinessImageUpload, updateBusiness);
router.delete('/:id', protect, deleteBusiness);
router.delete('/:id/images/:publicId', protect, deleteBusinessImage);

// Reviews (nested under businesses)
router.post('/:id/reviews', protect, createReview);

module.exports = router;

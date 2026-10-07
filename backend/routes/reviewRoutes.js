const express = require('express');
const router = express.Router();
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

// All review routes are protected
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;

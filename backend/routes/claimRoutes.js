const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/otpManager');
const createRateLimitStore = require('../utils/upstashStore');
const { verifyClaim, completeClaim } = require('../controllers/claimController');
const { protect } = require('../middlewares/auth');

// Rate limiter for verification attempts
const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => getClientIp(req),
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('claim-verify'),
});

// Verify 6-digit code or 1-click token
router.post('/verify', verifyRateLimiter, verifyClaim);

// Complete claim and take ownership (requires login with verified email)
router.post('/complete', protect, completeClaim);

module.exports = router;

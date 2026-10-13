const express = require('express');
const router = express.Router();
const { getPaymentSettings } = require('../controllers/settingController');

// Public route to fetch payment settings
router.get('/payment', getPaymentSettings);

module.exports = router;

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { sanitizeBody } = require('./sanitize');

// ─── Cloudinary Storage: Avatars ──────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'business-directory/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  },
});

// ─── Cloudinary Storage: Business Images ─────────────────────────────────────
const businessImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'business-directory/businesses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// ─── File Filter: MIME type validation ───────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed.'),
      false
    );
  }
};

// ─── Multer: Avatar upload (single, max 2MB) ──────────────────────────────────
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
}).single('avatar');

// ─── Cloudinary Storage: Business & Receipt Images ───────────────────────────
const businessAndReceiptStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isReceipt = file.fieldname === 'paymentReceipt';
    return {
      folder: isReceipt ? 'business-directory/receipts' : 'business-directory/businesses',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: isReceipt
        ? [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto' }]
        : [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
    };
  },
});

// ─── Multer: Business images (max 5) & Payment Receipt (max 1) ───────────────
const uploadBusinessImages = multer({
  storage: businessAndReceiptStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'paymentReceipt', maxCount: 1 },
]);

// ─── Error-handling wrappers ──────────────────────────────────────────────────
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Avatar must be under 2MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    sanitizeBody(req, res, next);
  });
};

const handleBusinessImageUpload = (req, res, next) => {
  uploadBusinessImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Each uploaded image/receipt must be under 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    sanitizeBody(req, res, next);
  });
};

// ─── Cloudinary Storage: Payment QR Code ─────────────────────────────────────
const qrCodeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'business-directory/payment-qr',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
  },
});

const uploadQrCode = multer({
  storage: qrCodeStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single('qrCode');

const handleQrCodeUpload = (req, res, next) => {
  uploadQrCode(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'QR code image must be under 5MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    sanitizeBody(req, res, next);
  });
};

// ─── Cloudinary Storage: Payment Method Card Image ──────────────────────────
const paymentCardStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'business-directory/payment-cards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const uploadPaymentCard = multer({
  storage: paymentCardStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single('cardImage');

const handlePaymentCardImageUpload = (req, res, next) => {
  uploadPaymentCard(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Card background image must be under 5MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    sanitizeBody(req, res, next);
  });
};

module.exports = {
  handleAvatarUpload,
  handleBusinessImageUpload,
  handleQrCodeUpload,
  handlePaymentCardImageUpload,
};

const { body, param, query, validationResult } = require('express-validator');

/**
 * Extract validation errors and return consistent format.
 * Call this at the start of each controller that has validation rules.
 */
const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    const err = new Error(messages[0]);
    err.statusCode = 422;
    err.errors = messages;
    throw err;
  }
};

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
];

const resetPasswordValidator = [
  body('newPassword')
    .custom((val, { req }) => {
      const p = val || req.body?.password;
      if (!p) {
        throw new Error('Password is required');
      }
      if (typeof p !== 'string' || p.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(p)) {
        throw new Error('Password must contain uppercase, lowercase, and a number');
      }
      return true;
    }),
  (req, res, next) => {
    const token = req.params?.token || req.body?.token;
    if (!token || typeof token !== 'string' || !token.trim()) {
      const err = new Error('Reset token is required');
      err.statusCode = 422;
      err.errors = ['Reset token is required'];
      return next(err);
    }
    next();
  },
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
];

// ─── Business Validators ──────────────────────────────────────────────────────
const { CATEGORIES } = require('../models/Business');
const { COUNTRIES, isValidCity } = require('./locations');

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const validateOpeningHours = (hours) => {
  if (!hours) return true;
  let parsed = hours;
  if (typeof hours === 'string') {
    try {
      parsed = JSON.parse(hours);
    } catch {
      throw new Error('Invalid opening hours format.');
    }
  }
  if (typeof parsed !== 'object' || parsed === null) return true;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    const dayData = parsed[day];
    if (dayData && !dayData.closed) {
      if (dayData.open && !timeFormatRegex.test(dayData.open)) {
        throw new Error(`Invalid open time for ${day}. Expected HH:MM`);
      }
      if (dayData.close && !timeFormatRegex.test(dayData.close)) {
        throw new Error(`Invalid close time for ${day}. Expected HH:MM`);
      }
    }
  }
  return true;
};

const businessValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Business title is required')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),
  body('contactPerson')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Contact person name cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('subcategory')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Subcategory cannot exceed 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-().]{7,25}$/).withMessage('Please provide a valid phone number'),
  body('whatsapp')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-().]{7,25}$/).withMessage('Please provide a valid WhatsApp number'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid website URL'),
  body('socialLinks.facebook')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid Facebook URL'),
  body('socialLinks.youtube')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid YouTube URL'),
  body('socialLinks.googleBusiness')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid Google Business profile URL'),
  body('address.country')
    .custom((val, { req }) => {
      const country = val || req.body?.country;
      if (!country || !country.trim()) {
        throw new Error('Country is required');
      }
      if (!COUNTRIES.includes(country.trim())) {
        throw new Error(`Country must be one of: ${COUNTRIES.join(', ')}`);
      }
      return true;
    }),
  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters')
    .custom((city, { req }) => {
      const country = req.body?.address?.country || req.body?.country;
      if (!country) {
        throw new Error('Country is required before selecting city');
      }
      if (!isValidCity(country, city)) {
        throw new Error(`City '${city}' is not a valid city in ${country}`);
      }
      return true;
    }),
  body('address.street')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage('Street cannot exceed 200 characters'),
  body('address.area')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('Area cannot exceed 100 characters'),
  body('address.zipCode')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }).withMessage('ZIP code cannot exceed 20 characters'),
  body('openingHours')
    .optional({ checkFalsy: true })
    .custom(validateOpeningHours),
];

const updateBusinessValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Business title cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('contactPerson')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Contact person name cannot exceed 100 characters'),
  body('subcategory')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Subcategory cannot exceed 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-().]{7,25}$/).withMessage('Please provide a valid phone number'),
  body('whatsapp')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-().]{7,25}$/).withMessage('Please provide a valid WhatsApp number'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid website URL'),
  body('socialLinks.facebook')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid Facebook URL'),
  body('socialLinks.youtube')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid YouTube URL'),
  body('socialLinks.googleBusiness')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid Google Business profile URL'),
  body('address.country')
    .optional()
    .custom((val, { req }) => {
      const country = val || req.body?.country;
      if (country && !COUNTRIES.includes(country.trim())) {
        throw new Error(`Country must be one of: ${COUNTRIES.join(', ')}`);
      }
      return true;
    }),
  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters')
    .custom(async (city, { req }) => {
      if (!city) return true;
      let country = req.body?.address?.country || req.body?.country;
      if (!country && req.params?.id) {
        const Business = require('../models/Business');
        const existing = await Business.findById(req.params.id).select('address.country').lean();
        country = existing?.address?.country;
      }
      if (!country) country = 'Pakistan';
      if (!isValidCity(country, city)) {
        throw new Error(`City '${city}' is not a valid city in ${country}`);
      }
      return true;
    }),
  body('address.street')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage('Street cannot exceed 200 characters'),
  body('address.area')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 }).withMessage('Area cannot exceed 100 characters'),
  body('address.zipCode')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }).withMessage('ZIP code cannot exceed 20 characters'),
  body('openingHours')
    .optional({ checkFalsy: true })
    .custom(validateOpeningHours),
];

// ─── Review Validators ────────────────────────────────────────────────────────
const reviewValidator = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
];

// ─── Param Validators ─────────────────────────────────────────────────────────
const objectIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  businessValidator,
  updateBusinessValidator,
  reviewValidator,
  objectIdValidator,
};

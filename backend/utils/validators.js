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
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('token')
    .notEmpty().withMessage('Reset token is required'),
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

// ─── Business Validators ──────────────────────────────────────────────────────
const { CATEGORIES } = require('../models/Business');

const businessValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Business title is required')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Please provide a valid phone number'),
  body('website')
    .optional({ checkFalsy: true })
    .isURL({ require_protocol: false }).withMessage('Please provide a valid website URL'),
  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('address.street')
    .optional({ checkFalsy: true })
    .isLength({ max: 200 }).withMessage('Street cannot exceed 200 characters'),
  body('address.zipCode')
    .optional({ checkFalsy: true })
    .isLength({ max: 20 }).withMessage('ZIP code cannot exceed 20 characters'),
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
  businessValidator,
  reviewValidator,
  objectIdValidator,
};

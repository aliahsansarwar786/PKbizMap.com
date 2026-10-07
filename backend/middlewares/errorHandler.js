const mongoose = require('mongoose');

/**
 * Centralized error handling middleware.
 * Must be the LAST middleware registered in Express.
 *
 * Handles:
 * - Mongoose validation errors
 * - Duplicate key errors (code 11000)
 * - Invalid ObjectId (CastError)
 * - JWT errors
 * - Multer errors
 * - Custom application errors
 * - Unknown server errors
 *
 * Never exposes stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // ─── Mongoose CastError (invalid ObjectId) ────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ─── Mongoose Validation Error ────────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors[0] || 'Validation failed';
  }

  // ─── MongoDB Duplicate Key (unique constraint) ────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // ─── Multer errors ────────────────────────────────────────────────────────
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  // ─── Log error (never log passwords, tokens, secrets) ────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔴 Error:', {
      message: err.message,
      statusCode,
      // stack intentionally omitted from logs in production
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  } else {
    // In production, only log non-sensitive info
    if (statusCode >= 500) {
      console.error(`🔴 Server Error [${req.method} ${req.path}]:`, message);
    }
  }

  // ─── Consistent error response ────────────────────────────────────────────
  const response = {
    success: false,
    message,
  };

  // Only include errors array if it has items
  if (errors.length > 0) {
    response.errors = errors;
  }

  // Never expose stack trace in production
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

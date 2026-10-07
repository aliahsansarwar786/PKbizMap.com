/**
 * Wraps async route handlers to catch errors and pass them to Express
 * error handling middleware, eliminating try/catch boilerplate.
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

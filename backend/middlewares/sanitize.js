const sanitizeHtml = require('sanitize-html');
const { SANITIZE_EXEMPT_FIELDS } = require('../utils/sanitizeConfig');

/**
 * Middleware to sanitize string fields in req.body to prevent XSS attacks.
 * Skips exempt fields such as password, email, and whitelisted enums.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (SANITIZE_EXEMPT_FIELDS.has(key)) {
          continue;
        }
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  if (typeof next === 'function') {
    next();
  }
};

module.exports = {
  sanitizeBody,
  SANITIZE_EXEMPT_FIELDS,
};

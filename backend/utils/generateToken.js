const jwt = require('jsonwebtoken');
const { setCsrfToken } = require('../middlewares/csrfProtection');

/**
 * Parses expiry string or number to milliseconds.
 * Accepts '7d' / '24h' / '30m' / '3600s' / plain-seconds strings or numbers.
 * Defaults to 7 days on anything unparseable.
 */
const parseExpiryToMs = (expiry) => {
  const DEFAULT_MS = 7 * 24 * 60 * 60 * 1000;
  if (!expiry) return DEFAULT_MS;

  if (typeof expiry === 'number' && Number.isFinite(expiry) && expiry > 0) {
    return expiry * 1000;
  }

  if (typeof expiry === 'string') {
    const trimmed = expiry.trim();
    if (!trimmed) return DEFAULT_MS;

    if (/^\d+$/.test(trimmed)) {
      const sec = parseInt(trimmed, 10);
      return sec > 0 ? sec * 1000 : DEFAULT_MS;
    }

    const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 's': return val * 1000;
        case 'm': return val * 60 * 1000;
        case 'h': return val * 60 * 60 * 1000;
        case 'd': return val * 24 * 60 * 60 * 1000;
        default: return DEFAULT_MS;
      }
    }
  }

  return DEFAULT_MS;
};

/**
 * Generate a JWT token and send it as a secure HttpOnly cookie.
 * JWT payload contains ONLY the minimum required information.
 * Also sets a double-submit CSRF cookie.
 *
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} extraData - Optional additional response payload
 */
const generateTokenAndSend = (user, statusCode, res, message, extraData = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured.');
  }

  // Minimal JWT payload - never include password or sensitive data
  const payload = {
    id: user._id,
    role: user.role,
  };

  const rawExpiry = process.env.JWT_EXPIRE || '7d';
  const isParsable =
    typeof rawExpiry === 'number' ||
    (typeof rawExpiry === 'string' &&
      (/^\d+$/.test(rawExpiry.trim()) || /^(\d+)\s*([smhd])$/i.test(rawExpiry.trim())));
  const effectiveExpiry = isParsable ? rawExpiry : '7d';
  const cookieMaxAge = parseExpiryToMs(effectiveExpiry);

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: effectiveExpiry,
  });

  // Session Cookie options
  const cookieOptions = {
    httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: cookieMaxAge,
    path: '/',
  };

  // Set double-submit CSRF token (cookie & header) bound to the newly signed JWT
  const csrfToken = setCsrfToken(res, token);

  // Safe user object (no password, no reset token)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified === true,
    permissions: user.permissions,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      csrfToken,
      data: { user: safeUser, csrfToken, ...extraData },
      ...extraData,
    });
};

module.exports = generateTokenAndSend;

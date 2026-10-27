const crypto = require('crypto');

/**
 * Double-submit cookie CSRF protection middleware.
 *
 * Enforces CSRF token validation on state-changing methods (POST, PATCH, PUT, DELETE)
 * for cookie-authenticated requests.
 */
const csrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();
  const isStateChanging = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

  // Safe HTTP methods (GET, HEAD, OPTIONS) do not alter server state
  if (!isStateChanging) {
    return next();
  }

  // CSRF protection applies to cookie-authenticated requests
  const hasSessionCookie = Boolean(req.cookies?.token);
  if (!hasSessionCookie) {
    return next();
  }

  // When a session cookie is present, require CSRF on login and register.
  // Only password-reset and email-verification public endpoints remain exempt.
  const publicAuthEndpoints = [
    '/api/auth/verify-email',
    '/api/auth/resend-otp',
    '/api/auth/forgot-password',
    '/api/auth/verify-reset-otp',
    '/api/auth/reset-password',
    '/api/auth/resend-reset-otp',
  ];

  const currentPath = req.originalUrl?.split('?')[0] || req.path;
  const isPublicAuth = publicAuthEndpoints.some(
    (ep) => currentPath === ep || currentPath.startsWith(ep)
  );

  if (isPublicAuth) {
    return next();
  }

  // Compare double-submit cookie and header
  const cookieToken = req.cookies?.['XSRF-TOKEN'] || req.cookies?.csrfToken;
  const headerToken = req.headers?.['x-csrf-token'] || req.headers?.['x-xsrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing CSRF token.',
    });
  }

  next();
};

/**
 * Generates and sets a double-submit CSRF cookie & header
 */
const setCsrfToken = (res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieOptions = {
    httpOnly: false, // Double-submit pattern: client needs to read or receive it
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie('XSRF-TOKEN', token, cookieOptions);
  res.set('X-CSRF-Token', token);
  return token;
};

module.exports = {
  csrfProtection,
  setCsrfToken,
};

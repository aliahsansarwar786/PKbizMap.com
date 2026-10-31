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

  // Normalise path before matching (lowercase + strip trailing slash, except root)
  const rawPath = typeof req.path === 'string' ? req.path.toLowerCase() : '';
  const normalisedPath = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;

  // CSRF protection applies to cookie-authenticated requests, plus unauthenticated auth/OTP endpoints
  const hasSessionCookie = Boolean(req.cookies?.token);
  const isEnforcedAuthRoute = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/verify-reset-otp',
    '/api/auth/forgot-password',
    '/api/auth/resend-otp',
    '/api/auth/resend-reset-otp',
    '/api/auth/correct-email',
  ].includes(normalisedPath);

  if (!hasSessionCookie && !isEnforcedAuthRoute) {
    return next();
  }

  // Compare double-submit cookie and header
  const cookieToken = req.cookies?.['XSRF-TOKEN'] || req.cookies?.csrfToken;
  const headerToken = req.headers?.['x-csrf-token'] || req.headers?.['x-xsrf-token'];

  if (!cookieToken || !headerToken || typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing CSRF token.',
    });
  }

  // Token format: <randomHex>.<hmacHex> (must be exactly 2 parts)
  const parts = cookieToken.split('.');
  if (parts.length !== 2) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing CSRF token.',
    });
  }

  const [randomHex, hmacHex] = parts;

  // Recompute HMAC with session fingerprint
  const fingerprint = req.cookies?.token || 'anonymous';
  const expectedHmac = crypto
    .createHmac('sha256', process.env.JWT_SECRET || '')
    .update(`${randomHex}:${fingerprint}`)
    .digest('hex');

  // Timing-safe verification of HMAC and full double-submit token
  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);
  const hmacBuf = Buffer.from(hmacHex);
  const expectedHmacBuf = Buffer.from(expectedHmac);

  const isHmacValid =
    hmacBuf.length === expectedHmacBuf.length &&
    crypto.timingSafeEqual(hmacBuf, expectedHmacBuf);

  const isDoubleSubmitValid =
    headerBuf.length === cookieBuf.length &&
    crypto.timingSafeEqual(headerBuf, cookieBuf);

  if (!isHmacValid || !isDoubleSubmitValid) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing CSRF token.',
    });
  }

  next();
};

/**
 * Generates and sets a double-submit CSRF cookie & header bound to session fingerprint
 */
const setCsrfToken = (res, fingerprint = 'anonymous') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured.');
  }

  const effectiveFingerprint = fingerprint || 'anonymous';
  const randomHex = crypto.randomBytes(32).toString('hex');
  const hmacHex = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${randomHex}:${effectiveFingerprint}`)
    .digest('hex');
  const token = `${randomHex}.${hmacHex}`;

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

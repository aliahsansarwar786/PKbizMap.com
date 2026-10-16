const crypto = require('crypto');
const OtpIpAttempt = require('../models/OtpIpAttempt');

const MAX_WRONG_ATTEMPTS = 4;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY_MS = 3 * 60 * 1000; // 3 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Extracts client IP safely from request headers (handles Vercel proxies).
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

/**
 * Generates a fresh, cryptographically random 6-digit numeric OTP string.
 */
const generate6DigitOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Computes SHA-256 hash of an OTP string.
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Constant-time comparison between raw OTP and stored SHA-256 hash to prevent timing attacks.
 */
const timingSafeCompare = (providedOtp, storedHash) => {
  if (!providedOtp || !storedHash) return false;
  const hashedProvided = hashOtp(providedOtp);
  const bufA = Buffer.from(hashedProvided, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Checks if the requesting IP is currently blocked for the specified action.
 * @param {string} ip
 * @param {string} action - 'email-verification' | 'password-reset'
 * @returns {Promise<{ isBlocked: boolean, retryAfterSeconds: number }>}
 */
const checkIpBlock = async (ip, action) => {
  if (!ip || ip === 'unknown') return { isBlocked: false, retryAfterSeconds: 0 };
  const record = await OtpIpAttempt.findOne({ ip, action });
  if (!record || !record.blockedUntil) {
    return { isBlocked: false, retryAfterSeconds: 0 };
  }
  const now = Date.now();
  if (record.blockedUntil.getTime() > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil.getTime() - now) / 1000);
    return { isBlocked: true, retryAfterSeconds };
  }
  return { isBlocked: false, retryAfterSeconds: 0 };
};

/**
 * Records a failed OTP attempt for this IP.
 * On 4 wrong attempts, blocks IP for 30 minutes.
 * @param {string} ip
 * @param {string} action - 'email-verification' | 'password-reset'
 * @returns {Promise<{ isBlocked: boolean, attempts: number, attemptsRemaining: number, retryAfterSeconds: number }>}
 */
const recordFailedAttempt = async (ip, action) => {
  const now = new Date();
  let record = await OtpIpAttempt.findOne({ ip, action });
  if (!record) {
    record = new OtpIpAttempt({ ip, action, attempts: 0 });
  }

  // If previous block expired, reset attempt counter
  if (record.blockedUntil && record.blockedUntil.getTime() <= now.getTime()) {
    record.attempts = 0;
    record.blockedUntil = null;
  }

  record.attempts += 1;
  let isBlocked = false;
  let retryAfterSeconds = 0;

  if (record.attempts >= MAX_WRONG_ATTEMPTS) {
    record.blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
    isBlocked = true;
    retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
  }

  await record.save();

  return {
    isBlocked,
    attempts: record.attempts,
    attemptsRemaining: Math.max(0, MAX_WRONG_ATTEMPTS - record.attempts),
    retryAfterSeconds,
  };
};

/**
 * Clears IP failure attempts upon successful OTP verification.
 */
const clearIpAttempts = async (ip, action) => {
  try {
    await OtpIpAttempt.deleteOne({ ip, action });
  } catch (err) {
    console.error('Failed to clear IP attempts:', err.message);
  }
};

module.exports = {
  MAX_WRONG_ATTEMPTS,
  BLOCK_DURATION_MS,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  getClientIp,
  generate6DigitOtp,
  hashOtp,
  timingSafeCompare,
  checkIpBlock,
  recordFailedAttempt,
  clearIpAttempts,
};

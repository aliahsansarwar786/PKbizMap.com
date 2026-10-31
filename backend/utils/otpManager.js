const crypto = require('crypto');
const OtpIpAttempt = require('../models/OtpIpAttempt');
const OtpEmailThrottle = require('../models/OtpEmailThrottle');

const MAX_WRONG_ATTEMPTS = 4;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const OTP_EXPIRY_MS = 3 * 60 * 1000; // 3 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_OTP_EMAILS_PER_HOUR = 5;

/**
 * Extracts client IP safely via Express trust-proxy resolution.
 * Express trust-proxy resolution (req.ip) is the single source of truth;
 * forwarding headers must never be read directly to prevent client spoofing.
 */
const getClientIp = (req) => {
  return req.ip || req.socket?.remoteAddress || 'unknown';
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

  // If previous block expired, reset attempt counter
  await OtpIpAttempt.updateOne(
    { ip, action, blockedUntil: { $ne: null, $lte: now } },
    { $set: { attempts: 0, blockedUntil: null } }
  );

  const record = await OtpIpAttempt.findOneAndUpdate(
    { ip, action },
    { $inc: { attempts: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let isBlocked = false;
  let retryAfterSeconds = 0;

  if (record.attempts >= MAX_WRONG_ATTEMPTS) {
    const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
    await OtpIpAttempt.updateOne(
      { ip, action },
      { $set: { blockedUntil } }
    );
    isBlocked = true;
    retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
  }

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

/**
 * Checks and increments the hourly OTP email rate limit for a specific email address atomically.
 * Max 5 OTP emails per email address per hour.
 */
const checkAndIncrementEmailOtpLimit = async (email) => {
  if (!email || typeof email !== 'string') return { allowed: true, retryAfterSeconds: 0 };
  const normalized = email.toLowerCase().trim();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const withinWindow = {
      $gt: [{ $ifNull: ['$createdAt', new Date(0)] }, oneHourAgo],
    };

    const record = await OtpEmailThrottle.findOneAndUpdate(
      { email: normalized },
      [
        {
          $set: {
            count: {
              $cond: [withinWindow, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1],
            },
            createdAt: {
              $cond: [withinWindow, '$createdAt', now],
            },
            updatedAt: now,
          },
        },
      ],
      { upsert: true, new: true }
    );

    const isAllowed = record && record.count <= MAX_OTP_EMAILS_PER_HOUR;
    if (!isAllowed) {
      const createdAtMs = record?.createdAt ? new Date(record.createdAt).getTime() : now.getTime();
      const retryAfterSeconds = Math.max(0, Math.ceil((createdAtMs + 3600 * 1000 - Date.now()) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error('Failed to check/increment email OTP limit:', err.message);
    return { allowed: true, retryAfterSeconds: 0 };
  }
};

/**
 * Refunds 1 consumed OTP email limit count on email send failure (never below 0).
 * Best-effort, wrapped in try/catch.
 */
const refundEmailOtpLimit = async (email) => {
  if (!email || typeof email !== 'string') return;
  const normalized = email.toLowerCase().trim();
  try {
    await OtpEmailThrottle.updateOne(
      { email: normalized, count: { $gt: 0 } },
      { $inc: { count: -1 } }
    );
  } catch (err) {
    console.error('Failed to refund email OTP limit:', err.message);
  }
};

module.exports = {
  MAX_WRONG_ATTEMPTS,
  BLOCK_DURATION_MS,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
  MAX_OTP_EMAILS_PER_HOUR,
  getClientIp,
  generate6DigitOtp,
  hashOtp,
  timingSafeCompare,
  checkIpBlock,
  recordFailedAttempt,
  clearIpAttempts,
  checkAndIncrementEmailOtpLimit,
  refundEmailOtpLimit,
};

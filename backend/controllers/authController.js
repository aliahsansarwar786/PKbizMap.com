const crypto = require('crypto');
const { body } = require('express-validator');
const User = require('../models/User');
const SpamBlockedEmail = require('../models/SpamBlockedEmail');
const asyncHandler = require('../utils/asyncHandler');
const generateTokenAndSend = require('../utils/generateToken');
const { setCsrfToken } = require('../middlewares/csrfProtection');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');
const {
  getWelcomeEmailHtml,
  getNewUserNotificationHtml,
  getEmailVerificationOtpHtml,
  getPasswordResetOtpHtml,
  getPasswordChangedSuccessEmailHtml,
} = require('../utils/emailTemplates');
const PaymentSetting = require('../models/PaymentSetting');
const bcrypt = require('bcryptjs');
const {
  generate6DigitOtp,
  hashOtp,
  timingSafeCompare,
  getClientIp,
  checkIpBlock,
  recordFailedAttempt,
  clearIpAttempts,
  checkAndIncrementEmailOtpLimit,
  refundEmailOtpLimit,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
} = require('../utils/otpManager');

// Precomputed 12-round bcrypt hash used for timing-safe dummy password comparisons
const DUMMY_HASH = '$2a$12$jqzh7bk27B/AYiavrRoThOnbT11VDB8oFoLc0M608Ctf/phHwGs1m';
const {
  validate,
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  resendOtpValidator,
  updateEmailValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordWithOtpValidator,
  changePasswordValidator,
  updateProfileValidator,
} = require('../utils/validators');
const getFrontendUrl = require('../utils/getFrontendUrl');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Creates unverified user, generates 3-min OTP, sends OTP email, returns requiresVerification: true
const register = [
  ...registerValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const genericSuccess = {
      success: true,
      message: 'Registration successful. Please verify your email with the 6-digit code sent to you.',
      requiresVerification: true,
      email: normalizedEmail,
    };

    // Check if email is in spam blocklist or belongs to a spam-flagged account
    const isBlocked = await SpamBlockedEmail.findOne({ email: normalizedEmail });
    if (isBlocked) {
      return res.status(201).json(genericSuccess);
    }

    // Check if user exists: if so, return the same generic success response without creating duplicate
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(201).json(genericSuccess);
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour)
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    // Generate fresh 6-digit numeric OTP and SHA-256 hash
    const otp = generate6DigitOtp();
    const otpHash = hashOtp(otp);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

    // Create user unverified
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      emailVerified: false,
      emailVerificationOTP: otpHash,
      emailVerificationOTPExpires: otpExpires,
      emailVerificationOTPAttempts: 0,
      emailVerificationLastResend: new Date(),
    });

    // Send OTP verification email: awaited before response so Vercel does not freeze
    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub verification code',
        html: getEmailVerificationOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:Register] Error sending verification OTP email:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:Register] Unexpected error sending verification OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    return res.status(201).json(genericSuccess);
  }),
];

// ─── POST /api/auth/verify-email ──────────────────────────────────────────────
// Verifies 6-digit registration OTP with timing-safe check and per-IP failure tracking
const verifyEmail = [
  ...verifyEmailValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    // 1. Check if IP is currently blocked
    const { isBlocked, retryAfterSeconds } = await checkIpBlock(ip, 'email-verification');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: `Too many failed attempts. Your IP has been temporarily blocked for 30 minutes. Please try again later.`,
      });
    }

    // 2. Find user including hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationOTPAttempts +emailVerificationOTPBlockedUntil'
    );

    if (!user) {
      const fail = await recordFailedAttempt(ip, 'email-verification');
      if (fail.isBlocked) {
        return res.status(429).set('Retry-After', String(fail.retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: fail.retryAfterSeconds,
          message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // Check if account is locked due to 5 failed OTP attempts
    if (user.emailVerificationOTPBlockedUntil) {
      if (user.emailVerificationOTPBlockedUntil.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil(
          (user.emailVerificationOTPBlockedUntil.getTime() - Date.now()) / 1000
        );
        return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: retryAfterSeconds,
          message: 'Too many failed verification attempts for this account. Account verification locked for 30 minutes.',
        });
      } else {
        // Block expired: reset attempts and clear lock
        user.emailVerificationOTPAttempts = 0;
        user.emailVerificationOTPBlockedUntil = undefined;
      }
    }

    // If user is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // 3. Check if OTP is expired
    if (!user.emailVerificationOTPExpires || user.emailVerificationOTPExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // 4. Timing-safe compare of OTP hash
    const isMatch = timingSafeCompare(otp, user.emailVerificationOTP);

    if (!isMatch) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { emailVerificationOTPAttempts: 1 } },
        { new: true }
      );
      const attempts = updatedUser ? updatedUser.emailVerificationOTPAttempts : (user.emailVerificationOTPAttempts || 0) + 1;

      if (attempts >= 5) {
        await User.updateOne(
          { _id: user._id },
          { $set: { emailVerificationOTPBlockedUntil: new Date(Date.now() + 30 * 60 * 1000) } }
        );
        await recordFailedAttempt(ip, 'email-verification');
        return res.status(429).set('Retry-After', '1800').json({
          success: false,
          isBlocked: true,
          retryAfter: 1800,
          message: 'Too many failed verification attempts for this account. Account verification locked for 30 minutes.',
        });
      }

      const fail = await recordFailedAttempt(ip, 'email-verification');
      if (fail.isBlocked) {
        return res.status(429).set('Retry-After', String(fail.retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: fail.retryAfterSeconds,
          message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    // 5. Success! Clear IP attempts and activate account
    await clearIpAttempts(ip, 'email-verification');

    user.emailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    user.emailVerificationOTPAttempts = 0;
    user.emailVerificationOTPBlockedUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // Capture request context before sending response
    const frontendUrl = getFrontendUrl(req);
    const verifiedUserEmail = user.email;
    const verifiedUserName = user.name;

    // Refresh session cookie with emailVerified = true and return response IMMEDIATELY
    generateTokenAndSend(user, 200, res, 'Email verified successfully! Welcome to BizPrimeHub.');

    // Fire-and-forget: dispatch welcome email and owner alert in background (non-blocking)
    (async () => {
      // Send Welcome Email upon successful verification
      try {
        const loginUrl = `${frontendUrl}/login`;
        sendEmail({
          to: verifiedUserEmail,
          subject: 'Welcome to BizPrimeHub!',
          html: getWelcomeEmailHtml({ name: verifiedUserName, loginUrl }),
        }).catch((err) => {
          console.error('⚠️ [Auth:VerifyEmail] Error sending welcome email:', err.message);
        });
      } catch (e) {
        console.error('⚠️ [Auth:VerifyEmail] Unexpected error sending welcome email:', e.message);
      }

      // Owner Notification: New user registered alert (triggered after email is verified)
      try {
        const settings = await PaymentSetting.getSettings();
        const ownerEmail = settings?.ownerNotificationEmail?.trim();
        const isOwnerNotificationsEnabled = settings?.ownerNotificationsEnabled !== false;

        if (isOwnerNotificationsEnabled && ownerEmail) {
          sendEmail({
            to: ownerEmail,
            subject: `New user registered: ${String(verifiedUserName || '').replace(/[\r\n]+/g, ' ').trim()}`,
            html: getNewUserNotificationHtml({
              name: verifiedUserName,
              email: verifiedUserEmail,
              date: new Date().toUTCString(),
            }),
          }).catch((err) => {
            console.error('⚠️ [Auth:VerifyEmail] Error sending owner alert:', err.message);
          });
        }
      } catch (e) {
        console.error('⚠️ [Auth:VerifyEmail] Unexpected error sending owner alert:', e.message);
      }
    })().catch((err) => {
      console.error('⚠️ [Auth:VerifyEmail] Background email task error:', err.message);
    });
  }),
];

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
// Resends registration OTP with 60s server-enforced cooldown
const resendOtp = [
  ...resendOtpValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    // Check if IP is currently blocked
    const { isBlocked, retryAfterSeconds } = await checkIpBlock(ip, 'email-verification');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.',
    };

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationLastResend +emailVerificationOTPBlockedUntil +emailVerificationOTPAttempts'
    );

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    if (user.emailVerified) {
      return res.status(200).json(genericResponse);
    }

    // Check account lockout
    if (user.emailVerificationOTPBlockedUntil) {
      if (user.emailVerificationOTPBlockedUntil.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil(
          (user.emailVerificationOTPBlockedUntil.getTime() - Date.now()) / 1000
        );
        return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: retryAfterSeconds,
          message: 'Account verification is temporarily locked for 30 minutes due to too many failed attempts.',
        });
      } else {
        // 30-minute block has expired: reset running count and clear lock
        user.emailVerificationOTPAttempts = 0;
        user.emailVerificationOTPBlockedUntil = undefined;
      }
    }

    // 60-second cooldown check
    if (user.emailVerificationLastResend) {
      const elapsed = Date.now() - new Date(user.emailVerificationLastResend).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).set('Retry-After', String(retryAfter)).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code.`,
        });
      }
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour)
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    // Generate fresh OTP (running failed attempts count is preserved)
    const otp = generate6DigitOtp();
    user.emailVerificationOTP = hashOtp(otp);
    user.emailVerificationOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.emailVerificationLastResend = new Date();
    await user.save({ validateBeforeSave: false });

    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub verification code',
        html: getEmailVerificationOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:ResendOtp] Error sending OTP:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:ResendOtp] Unexpected error sending OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    res.status(200).json(genericResponse);
  }),
];

// ─── PATCH /api/auth/email ────────────────────────────────────────────────────
// Allows authenticated-but-unverified user to correct a typo'd email
const updateEmail = [
  ...updateEmailValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    if (req.user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email is already verified and cannot be changed here.',
      });
    }

    const { newEmail } = req.body;
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    if (normalizedNewEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a different email address.',
      });
    }

    // Check IP block
    const ip = getClientIp(req);
    const { isBlocked, retryAfterSeconds: ipRetryAfter } = await checkIpBlock(ip, 'email-verification');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(ipRetryAfter)).json({
        success: false,
        isBlocked: true,
        retryAfter: ipRetryAfter,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    // Check spam blocklist
    const isSpamBlocked = await SpamBlockedEmail.findOne({ email: normalizedNewEmail });
    if (isSpamBlocked) {
      return res.status(400).json({
        success: false,
        message: 'This email address cannot be used.',
      });
    }

    // Check uniqueness (generic error to prevent existence oracle)
    const existing = await User.findOne({ email: normalizedNewEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This email address cannot be used.',
      });
    }

    const user = await User.findById(req.user._id).select(
      '+emailVerificationLastResend +emailVerificationOTPBlockedUntil +emailVerificationOTPAttempts'
    );

    // Check account lockout
    if (user.emailVerificationOTPBlockedUntil && user.emailVerificationOTPBlockedUntil.getTime() > Date.now()) {
      const retryAfterSeconds = Math.ceil(
        (user.emailVerificationOTPBlockedUntil.getTime() - Date.now()) / 1000
      );
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: 'Account verification is temporarily locked for 30 minutes due to too many failed attempts.',
      });
    }

    // 60-second cooldown check
    if (user.emailVerificationLastResend) {
      const elapsed = Date.now() - new Date(user.emailVerificationLastResend).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).set('Retry-After', String(retryAfter)).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code.`,
        });
      }
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour)
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedNewEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    // Generate fresh OTP for the new email (preserve running attempts and lock state)
    const otp = generate6DigitOtp();
    user.email = normalizedNewEmail;
    user.emailVerificationOTP = hashOtp(otp);
    user.emailVerificationOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.emailVerificationLastResend = new Date();
    await user.save({ validateBeforeSave: false });

    // Send OTP to new address
    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub verification code',
        html: getEmailVerificationOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:UpdateEmail] Error sending OTP to new email:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:UpdateEmail] Unexpected error sending OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    generateTokenAndSend(
      user,
      200,
      res,
      'Email updated successfully. A new verification code has been sent to your new email.',
      {
        email: user.email,
        requiresVerification: true,
      }
    );
  }),
];

const correctEmailValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .notEmpty().withMessage('Password is required'),
  body('newEmail')
    .trim()
    .notEmpty().withMessage('New email address is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail({ gmail_remove_dots: false }),
];

// ─── POST /api/auth/correct-email ─────────────────────────────────────────────
// Allows unauthenticated user to correct a typo'd email during verification by proving password
const correctEmail = [
  ...correctEmailValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, password, newEmail } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const normalizedNewEmail = (newEmail || '').toLowerCase().trim();

    // Verify email + password with bcrypt against the User
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +emailVerificationLastResend +emailVerificationOTPBlockedUntil +emailVerificationOTPAttempts'
    );

    if (!user) {
      await bcrypt.compare(password || '', DUMMY_HASH);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Require emailVerified === false (already-verified → generic 400)
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email is already verified and cannot be changed here.',
      });
    }

    if (normalizedNewEmail === normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a different email address.',
      });
    }

    // Check IP block
    const ip = getClientIp(req);
    const { isBlocked, retryAfterSeconds: ipRetryAfter } = await checkIpBlock(ip, 'email-verification');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(ipRetryAfter)).json({
        success: false,
        isBlocked: true,
        retryAfter: ipRetryAfter,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    // Check spam blocklist
    const isSpamBlocked = await SpamBlockedEmail.findOne({ email: normalizedNewEmail });
    if (isSpamBlocked) {
      return res.status(400).json({
        success: false,
        message: 'This email address cannot be used.',
      });
    }

    // Check uniqueness (generic error to prevent existence oracle)
    const existing = await User.findOne({ email: normalizedNewEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This email address cannot be used.',
      });
    }

    // 60-second cooldown check
    if (user.emailVerificationLastResend) {
      const elapsed = Date.now() - new Date(user.emailVerificationLastResend).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).set('Retry-After', String(retryAfter)).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code.`,
        });
      }
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour) AFTER all no-send returns
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedNewEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    // On success: update the email, reset OTP attempts + clear lock, send a fresh 6-digit OTP to the NEW email
    const otp = generate6DigitOtp();
    user.email = normalizedNewEmail;
    user.emailVerificationOTP = hashOtp(otp);
    user.emailVerificationOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.emailVerificationLastResend = new Date();
    user.emailVerificationOTPAttempts = 0;
    user.emailVerificationOTPBlockedUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // Send OTP to new address
    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub verification code',
        html: getEmailVerificationOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:CorrectEmail] Error sending OTP to new email:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:CorrectEmail] Unexpected error sending OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email updated successfully. A new verification code has been sent to your new email.',
      email: user.email,
    });
  }),
];

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Replaces reset-link flow: sends a 6-digit OTP to user's email (generic response always)
const forgotPassword = [
  ...forgotPasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    // Check IP block
    const { isBlocked, retryAfterSeconds } = await checkIpBlock(ip, 'password-reset');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.',
    };

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetPasswordLastResend +resetPasswordOTPBlockedUntil +resetPasswordOTPAttempts'
    );

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Check account lockout
    if (user.resetPasswordOTPBlockedUntil) {
      if (user.resetPasswordOTPBlockedUntil.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil(
          (user.resetPasswordOTPBlockedUntil.getTime() - Date.now()) / 1000
        );
        return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: retryAfterSeconds,
          message: 'Password reset is temporarily locked for 30 minutes due to too many failed attempts.',
        });
      } else {
        // 30-minute block has expired: reset running count and clear lock
        user.resetPasswordOTPAttempts = 0;
        user.resetPasswordOTPBlockedUntil = undefined;
      }
    }

    // 60-second cooldown check
    if (user.resetPasswordLastResend) {
      const elapsed = Date.now() - new Date(user.resetPasswordLastResend).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).set('Retry-After', String(retryAfter)).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code.`,
        });
      }
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour)
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    // Generate fresh OTP (running failed attempts count is preserved)
    const otp = generate6DigitOtp();
    user.resetPasswordOTP = hashOtp(otp);
    user.resetPasswordOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetPasswordLastResend = new Date();
    // Clear any previous reset tokens
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub password reset code',
        html: getPasswordResetOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:ForgotPassword] Error sending reset OTP:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:ForgotPassword] Unexpected error sending reset OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    res.status(200).json(genericResponse);
  }),
];

// ─── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
// Step 2 of password reset: validates OTP, returns single-use 10-minute resetToken
const verifyResetOtp = [
  ...verifyResetOtpValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    // 1. Check IP block
    const { isBlocked, retryAfterSeconds } = await checkIpBlock(ip, 'password-reset');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    // 2. Find user
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetPasswordOTP +resetPasswordOTPExpires +resetPasswordOTPAttempts +resetPasswordOTPBlockedUntil'
    );

    if (!user) {
      const fail = await recordFailedAttempt(ip, 'password-reset');
      if (fail.isBlocked) {
        return res.status(429).set('Retry-After', String(fail.retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: fail.retryAfterSeconds,
          message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
        });
      }
      return res.status(400).json({
        success: false,
        attemptsRemaining: fail.attemptsRemaining,
        message: 'Invalid or expired verification code.',
      });
    }

    // Check if account is locked due to 5 failed OTP attempts
    if (user.resetPasswordOTPBlockedUntil) {
      if (user.resetPasswordOTPBlockedUntil.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil(
          (user.resetPasswordOTPBlockedUntil.getTime() - Date.now()) / 1000
        );
        return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: retryAfterSeconds,
          message: 'Too many failed verification attempts for this account. Password reset locked for 30 minutes.',
        });
      } else {
        // Block expired: reset attempts and clear lock
        user.resetPasswordOTPAttempts = 0;
        user.resetPasswordOTPBlockedUntil = undefined;
      }
    }

    // 3. Expiry check
    if (!user.resetPasswordOTPExpires || user.resetPasswordOTPExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    // 4. Timing safe compare
    const isMatch = timingSafeCompare(otp, user.resetPasswordOTP);

    if (!isMatch) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { resetPasswordOTPAttempts: 1 } },
        { new: true }
      );
      const attempts = updatedUser ? updatedUser.resetPasswordOTPAttempts : (user.resetPasswordOTPAttempts || 0) + 1;

      if (attempts >= 5) {
        await User.updateOne(
          { _id: user._id },
          { $set: { resetPasswordOTPBlockedUntil: new Date(Date.now() + 30 * 60 * 1000) } }
        );
        await recordFailedAttempt(ip, 'password-reset');
        return res.status(429).set('Retry-After', '1800').json({
          success: false,
          isBlocked: true,
          retryAfter: 1800,
          message: 'Too many failed verification attempts for this account. Password reset locked for 30 minutes.',
        });
      }

      const fail = await recordFailedAttempt(ip, 'password-reset');
      if (fail.isBlocked) {
        return res.status(429).set('Retry-After', String(fail.retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: fail.retryAfterSeconds,
          message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
        });
      }

      const userAttemptsRemaining = Math.max(0, 5 - attempts);
      return res.status(400).json({
        success: false,
        attemptsRemaining: Math.min(fail.attemptsRemaining, userAttemptsRemaining),
        message: `Invalid verification code. ${userAttemptsRemaining} attempt${userAttemptsRemaining === 1 ? '' : 's'} remaining before account lockout.`,
      });
    }

    // 5. Success! Clear IP attempts and issue single-use passwordResetToken (10-min expiry)
    await clearIpAttempts(ip, 'password-reset');

    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    user.resetPasswordOTPAttempts = 0;
    user.resetPasswordOTPBlockedUntil = undefined;

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    user.resetPasswordTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      resetToken: rawResetToken,
      message: 'Verification code confirmed. You may now set your new password.',
    });
  }),
];

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
// Step 3 of password reset: validates single-use resetToken, hashes new password, sends confirmation email
const resetPassword = [
  ...resetPasswordWithOtpValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, resetToken, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Hash incoming resetToken to match stored hash
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordTokenHash: hashedToken,
      resetPasswordTokenExpires: { $gt: Date.now() },
    }).select('+resetPasswordTokenHash +resetPasswordTokenExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session. Please request a new verification code.',
      });
    }

    // Set new password (pre-save hook hashes with bcrypt)
    user.password = newPassword;
    user.passwordChangedAt = new Date(Date.now() - 2000);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordTokenExpires = undefined;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    user.resetPasswordOTPAttempts = 0;
    user.resetPasswordOTPBlockedUntil = undefined;
    user.resetPasswordToken = undefined; // Clear legacy field
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email: "password changed"
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub password has been changed',
        html: getPasswordChangedSuccessEmailHtml({ name: user.name }),
      }).catch((err) => {
        console.error('⚠️ [Auth:ResetPassword] Error sending confirmation email:', err.message);
      });
    } catch (e) {
      console.error('⚠️ [Auth:ResetPassword] Unexpected error sending confirmation email:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  }),
];

// ─── POST /api/auth/resend-reset-otp ──────────────────────────────────────────
// Resends password reset OTP with 60s cooldown (generic response)
const resendResetOtp = [
  ...resendOtpValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIp(req);

    const { isBlocked, retryAfterSeconds } = await checkIpBlock(ip, 'password-reset');
    if (isBlocked) {
      return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
        success: false,
        isBlocked: true,
        retryAfter: retryAfterSeconds,
        message: 'Too many failed attempts. Your IP has been temporarily blocked for 30 minutes.',
      });
    }

    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a new verification code has been sent.',
    };

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+resetPasswordLastResend +resetPasswordOTPBlockedUntil +resetPasswordOTPAttempts'
    );

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Check account lockout
    if (user.resetPasswordOTPBlockedUntil) {
      if (user.resetPasswordOTPBlockedUntil.getTime() > Date.now()) {
        const retryAfterSeconds = Math.ceil(
          (user.resetPasswordOTPBlockedUntil.getTime() - Date.now()) / 1000
        );
        return res.status(429).set('Retry-After', String(retryAfterSeconds)).json({
          success: false,
          isBlocked: true,
          retryAfter: retryAfterSeconds,
          message: 'Password reset is temporarily locked for 30 minutes due to too many failed attempts.',
        });
      } else {
        // 30-minute block has expired: reset running count and clear lock
        user.resetPasswordOTPAttempts = 0;
        user.resetPasswordOTPBlockedUntil = undefined;
      }
    }

    // 60-second cooldown check
    if (user.resetPasswordLastResend) {
      const elapsed = Date.now() - new Date(user.resetPasswordLastResend).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).set('Retry-After', String(retryAfter)).json({
          success: false,
          retryAfter,
          message: `Please wait ${retryAfter} seconds before requesting a new code.`,
        });
      }
    }

    // Check per-email OTP throttle (max 5 OTP emails per hour)
    const throttle = await checkAndIncrementEmailOtpLimit(normalizedEmail);
    if (!throttle.allowed) {
      return res.status(429).set('Retry-After', String(throttle.retryAfterSeconds)).json({
        success: false,
        message: 'Too many verification code requests for this email. Please try again later.',
      });
    }

    const otp = generate6DigitOtp();
    user.resetPasswordOTP = hashOtp(otp);
    user.resetPasswordOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.resetPasswordLastResend = new Date();
    await user.save({ validateBeforeSave: false });

    try {
      const sent = await sendEmail({
        to: user.email,
        subject: 'Your BizPrimeHub password reset code',
        html: getPasswordResetOtpHtml({ name: user.name, otp }),
      }).catch((err) => {
        console.error('⚠️ [Auth:ResendResetOtp] Error sending OTP:', err.message);
        return false;
      });

      if (!sent) {
        await refundEmailOtpLimit(user.email);
        return res.status(502).json({
          success: false,
          message: 'We could not send the verification code. Please try again in a minute.',
        });
      }
    } catch (e) {
      console.error('⚠️ [Auth:ResendResetOtp] Unexpected error sending OTP:', e.message);
      await refundEmailOtpLimit(user.email);
      return res.status(502).json({
        success: false,
        message: 'We could not send the verification code. Please try again in a minute.',
      });
    }

    res.status(200).json(genericResponse);
  }),
];

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = [
  ...loginValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      // Timing-safe: run bcrypt compare against fixed dummy hash to prevent user enumeration via timing
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check per-account lockout (15 minutes after 5 failed logins)
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.lockUntil && user.lockUntil.getTime() <= Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      user.loginAttempts = attempts;
      if (attempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
      }
      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Login successful: reset failed login attempts and lock
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
    }

    if (!user.emailVerified && user.role !== 'admin' && user.role !== 'subadmin') {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: 'Please verify your email before logging in. Enter the 6-digit code sent to your email.',
      });
    }

    generateTokenAndSend(user, 200, res, 'Logged in successfully.');
  }),
];

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Accepted Tradeoff: JWTs are stateless and remain cryptographically valid until their
// 7-day expiry after logout. The token cookie is cleared from the client. Password change
// explicitly invalidates previously issued tokens via user.passwordChangedAt. A token
// denylist or server-side session revocation is intentionally omitted for simplicity.
const logout = asyncHandler(async (req, res) => {
  res
    .status(200)
    .cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    })
    .json({
      success: true,
      message: 'Logged out successfully.',
    });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  let csrfToken = req.cookies?.['XSRF-TOKEN'] || req.cookies?.csrfToken;
  if (!csrfToken) {
    csrfToken = setCsrfToken(res, req.cookies?.token || 'anonymous');
  } else {
    res.set('X-CSRF-Token', csrfToken);
  }

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully.',
    csrfToken,
    data: { user: req.user, csrfToken },
  });
});

// ─── GET /api/auth/csrf-token ─────────────────────────────────────────────────
const getCsrfToken = asyncHandler(async (req, res) => {
  const fingerprint = req.cookies?.token || 'anonymous';
  const csrfToken = setCsrfToken(res, fingerprint);

  res.status(200).json({
    success: true,
    csrfToken,
  });
});

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────
const changePassword = [
  ...changePasswordValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.',
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date(Date.now() - 2000);
    await user.save();

    generateTokenAndSend(user, 200, res, 'Password changed successfully.');
  }),
];

// ─── PATCH /api/auth/update-profile ──────────────────────────────────────────
const updateProfile = [
  ...updateProfileValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const allowedFields = ['name'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.file) {
      if (req.user.avatar?.publicId) {
        await cloudinary.uploader.destroy(req.user.avatar.publicId);
      }
      updates.avatar = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  }),
];

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  updateEmail,
  correctEmail,
  login,
  logout,
  getMe,
  getCsrfToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
  changePassword,
  updateProfile,
};

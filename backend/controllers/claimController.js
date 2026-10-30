const crypto = require('crypto');
const mongoose = require('mongoose');
const ClaimRequest = require('../models/ClaimRequest');
const Business = require('../models/Business');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { getClaimVerificationEmailHtml, getNewClaimNotificationHtml } = require('../utils/emailTemplates');
const PaymentSetting = require('../models/PaymentSetting');
const getFrontendUrl = require('../utils/getFrontendUrl');
const { getClientIp } = require('../utils/otpManager');

// Helper to mask email (e.g. co*****s@domain.com)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.charAt(0)}*@${domain}`;
  }
  const first = local.slice(0, 2);
  const last = local.slice(-1);
  const stars = '*'.repeat(Math.max(3, Math.min(6, local.length - 3)));
  return `${first}${stars}${last}@${domain}`;
};

// ─── POST /api/businesses/:id/claim ──────────────────────────────────────────
// Public with IP rate limiter: Initiate a claim request
const requestClaim = asyncHandler(async (req, res) => {
  const identifier = (req.params.id || '').trim();
  const { claimantName, emailOption, directEmail, phone } = req.body;

  if (!claimantName || claimantName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name or designation is required (at least 2 characters).',
    });
  }

  if (!phone || phone.trim().length < 7) {
    return res.status(400).json({
      success: false,
      message: 'A valid phone or WhatsApp number is required.',
    });
  }

  let business = await Business.findOne({ slug: identifier, isApproved: true });
  if (!business && mongoose.Types.ObjectId.isValid(identifier)) {
    business = await Business.findOne({ _id: identifier, isApproved: true });
  }

  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  if (business.isClaimed || business.claimed) {
    return res.status(400).json({
      success: false,
      message: 'This business has already been claimed by a verified owner.',
    });
  }

  // Direct/corporate email option is completely removed.
  // Claims are strictly restricted to the business's registered email.
  if (emailOption === 'direct' || emailOption !== 'registered') {
    return res.status(400).json({
      success: false,
      message: "Claims can only be made through the business's registered email.",
    });
  }

  if (!business.email || !business.email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Claims can only be made through the business's registered email.",
    });
  }

  const targetEmail = business.email.trim().toLowerCase();

  // If a chosenEmail or directEmail was passed that does not match registered email, reject
  if (req.body.chosenEmail && req.body.chosenEmail.trim().toLowerCase() !== targetEmail) {
    return res.status(400).json({
      success: false,
      message: "Claims can only be made through the business's registered email.",
    });
  }
  if (directEmail && directEmail.trim().toLowerCase() !== targetEmail) {
    return res.status(400).json({
      success: false,
      message: "Claims can only be made through the business's registered email.",
    });
  }

  // Flooding cooldown:
  // 1. Check if 3 or more claims were created for this business in the last 60 minutes
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentClaimsCount = await ClaimRequest.countDocuments({
    business: business._id,
    createdAt: { $gte: oneHourAgo },
  });
  if (recentClaimsCount >= 3) {
    return res.status(429).json({
      success: false,
      message: 'Too many claim requests for this business. Please try again later.',
    });
  }

  // 2. Check if the most recent claim for this business was created less than 60 seconds ago
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const latestClaim = await ClaimRequest.findOne({ business: business._id }).sort({ createdAt: -1 });
  if (latestClaim && latestClaim.createdAt >= sixtySecondsAgo) {
    return res.status(429).json({
      success: false,
      message: 'Too many claim requests for this business. Please try again later.',
    });
  }

  // Multiple-claim sharing: expire ALL active claims for this business (pending, verified, pending_admin)
  await ClaimRequest.updateMany(
    {
      business: business._id,
      status: { $in: ['pending', 'verified', 'pending_admin'] },
    },
    { status: 'expired' }
  );

  // Generate 6-digit numeric verification code, random token, and random 16-byte hex salt per claim
  const code = crypto.randomInt(100000, 1000000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const codeSalt = crypto.randomBytes(16).toString('hex');

  const codeHash = crypto.createHash('sha256').update(`${codeSalt}:${code}`).digest('hex');
  const tokenHash = crypto.createHash('sha256').update(`${codeSalt}:${token}`).digest('hex');

  const expiresAtCode = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  const expiresAtToken = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const claimRequest = await ClaimRequest.create({
    business: business._id,
    claimantName: claimantName.trim(),
    emailOption: 'registered',
    chosenEmail: targetEmail,
    phone: phone.trim(),
    codeSalt,
    codeHash,
    tokenHash,
    expiresAtCode,
    expiresAtToken,
    status: 'pending',
    failedAttempts: 0,
    ipAddress: getClientIp(req),
  });

  const frontendUrl = getFrontendUrl();

  // Send ONE email with 6-digit code only (NO verification link)
  const emailHtml = getClaimVerificationEmailHtml({
    businessTitle: business.title,
    claimantName: claimantName.trim(),
    code,
  });

  const emailSent = await sendEmail({
    to: targetEmail,
    subject: `[Verification Code] Claim Listing "${business.title}" on BizPrimeHub`,
    html: emailHtml,
    text: `Claim Verification for ${business.title}\n\nYour 6-digit verification code is: ${code}\n(This code expires in 30 minutes)\n\nEnter this code on BizPrimeHub to verify ownership of your business listing.\n\nIf you did not request this, please disregard.`,
  });

  if (!emailSent) {
    await ClaimRequest.findByIdAndDelete(claimRequest._id);
    return res.status(502).json({
      success: false,
      message: 'Verification email could not be sent. Please try again in a few minutes.',
    });
  }

  // Owner Notification: Whenever a new claim request is created
  try {
    const activeSettings = await PaymentSetting.getSettings();
    const ownerEmail = activeSettings?.ownerNotificationEmail?.trim();
    const isOwnerNotificationsEnabled = activeSettings?.ownerNotificationsEnabled !== false;

    if (isOwnerNotificationsEnabled && ownerEmail) {
      const adminUrl = `${frontendUrl}/folder/new/admin`;

      await sendEmail({
        to: ownerEmail,
        subject: `New Claim Request: ${String(business.title || '').replace(/[\r\n]+/g, ' ').trim()}`,
        html: getNewClaimNotificationHtml({
          businessTitle: business.title,
          claimantName: claimantName.trim(),
          claimantEmail: targetEmail,
          claimantPhone: phone.trim(),
          pathUsed: 'registered',
          adminUrl,
        }),
        text: `New Claim Request: ${business.title}\n\nBusiness Name: ${business.title}\nClaimant Name: ${claimantName.trim()}\nClaimant Email: ${targetEmail}\nClaimant Phone: ${phone.trim()}\nEmail Path Used: Registered Business Email\n\nReview in Admin Panel: ${adminUrl}`,
      }).catch((err) => {
        console.error('⚠️ [Claim:Request] Non-fatal error sending owner alert:', err.message);
      });
    }
  } catch (e) {
    console.error('⚠️ [Claim:Request] Unexpected error setting up owner alert:', e.message);
  }

  res.status(200).json({
    success: true,
    message: 'Verification code sent successfully to the business registered email.',
    data: {
      claimId: claimRequest._id,
      businessId: business._id,
      slug: business.slug,
      maskedEmail: maskEmail(targetEmail),
    },
  });
});

// ─── POST /api/claims/verify ─────────────────────────────────────────────────
// Public: Verify 6-digit code only (requires claimId or email; global code-only lookup removed)
const verifyClaim = asyncHandler(async (req, res) => {
  const { token, code, email, claimId } = req.body;

  // Claim verification works by entering the 6-digit code only. Link verification is disabled.
  if (token && token.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Link verification is no longer supported. Please verify your claim by entering the 6-digit code sent to your registered business email.',
    });
  }

  // FIX 2: Require claimId (or email) on EVERY verify attempt; reject requests supplying neither with HTTP 400
  if ((!claimId || !String(claimId).trim()) && (!email || !String(email).trim())) {
    return res.status(400).json({
      success: false,
      message: 'Claim ID or registered email is required for verification.',
    });
  }

  if (!code || !code.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please submit a new claim request.',
    });
  }

  // Identify specific claim request by claimId or email (never look up by codeHash alone)
  let candidateClaim = null;
  if (claimId && mongoose.Types.ObjectId.isValid(claimId)) {
    candidateClaim = await ClaimRequest.findById(claimId)
      .select('+codeHash +codeSalt')
      .populate('business', 'title slug category address isClaimed claimed email');
  } else if (email && email.trim()) {
    candidateClaim = await ClaimRequest.findOne({
      chosenEmail: email.trim().toLowerCase(),
      status: { $in: ['pending', 'verified', 'pending_admin'] },
    })
      .select('+codeHash +codeSalt')
      .sort({ createdAt: -1 })
      .populate('business', 'title slug category address isClaimed claimed email');
  }

  if (!candidateClaim) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please submit a new claim request.',
    });
  }

  // Enforce 5-attempt lockout
  if ((candidateClaim.failedAttempts || 0) >= 5) {
    return res.status(400).json({
      success: false,
      message: 'Too many failed verification attempts. This code has been locked. Please submit a new claim request.',
    });
  }

  // Compare salted code hash with timing-safe comparison
  // If candidateClaim has no codeSalt (old format), treat code as invalid (do not fall back to unsalted)
  let isCodeMatch = false;
  if (candidateClaim.codeSalt && candidateClaim.codeHash) {
    const computedHash = crypto
      .createHash('sha256')
      .update(`${candidateClaim.codeSalt}:${code.trim()}`)
      .digest('hex');
    const hashBuf = Buffer.from(computedHash, 'utf8');
    const storedBuf = Buffer.from(candidateClaim.codeHash, 'utf8');
    isCodeMatch = hashBuf.length === storedBuf.length && crypto.timingSafeEqual(hashBuf, storedBuf);
  }

  const isNotExpired = candidateClaim.expiresAtCode && candidateClaim.expiresAtCode > new Date();
  const isStatusValid = ['pending', 'verified', 'pending_admin'].includes(candidateClaim.status);

  if (!isCodeMatch || !isNotExpired || !isStatusValid) {
    candidateClaim.failedAttempts = (candidateClaim.failedAttempts || 0) + 1;
    await candidateClaim.save();
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code. Please submit a new claim request.',
    });
  }

  const claim = candidateClaim;

  if (claim.business?.isClaimed || claim.business?.claimed) {
    return res.status(400).json({
      success: false,
      message: 'This business has already been claimed.',
    });
  }

  // Clear stored codeHash, codeSalt, and expiresAtCode so code cannot be reused
  claim.codeHash = null;
  claim.codeSalt = null;
  claim.expiresAtCode = null;

  // Sanitized business object: NEVER return the business phone in verify response
  const sanitizedBusiness = claim.business
    ? {
        _id: claim.business._id,
        title: claim.business.title,
        slug: claim.business.slug,
        category: claim.business.category,
        address: claim.business.address,
        isClaimed: claim.business.isClaimed,
        claimed: claim.business.claimed,
        email: claim.business.email,
      }
    : null;

  // Determine path: direct vs registered
  const isDirect =
    claim.emailOption === 'direct' ||
    (!claim.emailOption && claim.business?.email && claim.chosenEmail !== claim.business.email.toLowerCase());

  if (isDirect) {
    // DIRECT-EMAIL PATH: Set status to pending_admin, do NOT transfer ownership
    claim.status = 'pending_admin';
    if (!claim.verifiedAt) {
      claim.verifiedAt = new Date();
    }
    await claim.save();

    return res.status(200).json({
      success: true,
      message:
        'Your request has been received. The website owner will verify your claim and contact you — ownership is transferred only after approval.',
      data: {
        claimId: claim._id,
        chosenEmail: claim.chosenEmail,
        claimantName: claim.claimantName,
        business: sanitizedBusiness,
        status: claim.status,
        emailOption: 'direct',
      },
    });
  }

  // REGISTERED-EMAIL PATH: Keep working as before
  if (claim.status === 'pending') {
    claim.status = 'verified';
    claim.verifiedAt = new Date();
  }
  await claim.save();

  res.status(200).json({
    success: true,
    message: 'Claim request verified successfully.',
    data: {
      claimId: claim._id,
      chosenEmail: claim.chosenEmail,
      claimantName: claim.claimantName,
      business: sanitizedBusiness,
      status: claim.status,
      emailOption: 'registered',
    },
  });
});

// ─── POST /api/claims/complete ───────────────────────────────────────────────
// Protected: Complete claim with authenticated account matching chosenEmail
const completeClaim = asyncHandler(async (req, res) => {
  const { claimId } = req.body;

  if (!claimId || !mongoose.Types.ObjectId.isValid(claimId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid Claim ID is required.',
    });
  }

  const claim = await ClaimRequest.findById(claimId).populate('business');
  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Claim request not found.',
    });
  }

  // Null-business guard: after populate, if claim.business is null or missing, return 404 with a generic message.
  // Do NOT dereference claim.business._id before this guard - this is the crash when the business was deleted.
  if (!claim.business) {
    return res.status(404).json({
      success: false,
      message: 'The business associated with this claim no longer exists.',
    });
  }

  // claimId path: proceed ONLY when status is 'verified'.
  // Explicitly reject 'rejected' and 'expired' (400, clear message).
  if (claim.status === 'rejected') {
    return res.status(400).json({
      success: false,
      message: 'This claim request has been rejected.',
    });
  }

  if (claim.status === 'expired') {
    return res.status(400).json({
      success: false,
      message: 'This claim request has expired.',
    });
  }

  if (claim.status === 'completed' || claim.status === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'This claim request has already been completed.',
    });
  }

  if (claim.status === 'pending_admin' || claim.emailOption === 'direct') {
    return res.status(403).json({
      success: false,
      message: 'Direct email claims require review and approval by the site owner. Ownership is transferred only after approval.',
    });
  }

  if (claim.status !== 'verified') {
    return res.status(400).json({
      success: false,
      message: 'Claim request has not been verified.',
    });
  }

  // Verified claims complete within 7 days of verifiedAt (or createdAt if verifiedAt is missing)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const verifiedTime = claim.verifiedAt || claim.createdAt;
  if (verifiedTime && (Date.now() - new Date(verifiedTime).getTime() > SEVEN_DAYS_MS)) {
    claim.status = 'expired';
    await claim.save();
    return res.status(400).json({
      success: false,
      message: 'This claim request has expired (7-day completion window exceeded).',
    });
  }

  const business = await Business.findById(claim.business._id || claim.business);
  if (!business) {
    return res.status(404).json({ success: false, message: 'The business associated with this claim no longer exists.' });
  }

  if (business.isClaimed || business.claimed) {
    return res.status(400).json({
      success: false,
      message: 'This business has already been claimed.',
    });
  }

  // Spam guard: if req.user.isSpam is true, return 403 and do NOT transfer, even if the email matches.
  if (req.user?.isSpam) {
    return res.status(403).json({
      success: false,
      message: 'Account is flagged as spam. Ownership transfer blocked.',
    });
  }

  // Email-verified guard: if req.user.emailVerified is not true, return 403 and do NOT transfer
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account email must be verified before completing a business claim.',
    });
  }

  // Check that the currently authenticated user's email matches the verified claim email
  // Generic email-mismatch message: if the logged-in user's email does not match claim.chosenEmail,
  // return 403 with a generic message that does not include either email address.
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const claimEmail = (claim.chosenEmail || '').trim().toLowerCase();

  if (userEmail !== claimEmail) {
    return res.status(403).json({
      success: false,
      message: 'Account email does not match the verified claim email address.',
    });
  }

  // Transfer ownership & mark as claimed
  business.owner = req.user._id;
  business.isClaimed = true;
  business.claimed = true;
  business.claimedAt = new Date();
  business.claimedBy = req.user._id;
  await business.save();

  // Mark request completed
  claim.status = 'completed';
  claim.completedAt = new Date();
  claim.claimedBy = req.user._id;
  await claim.save();

  // Strip sensitive payment fields before responding
  const businessObj = business.toObject();
  delete businessObj.paymentReceipt;
  delete businessObj.paymentStatus;
  delete businessObj.paymentAmount;

  res.status(200).json({
    success: true,
    message: 'Ownership verified! You now own this listing.',
    data: {
      business: businessObj,
      claimId: claim._id,
    },
  });
});

module.exports = {
  requestClaim,
  verifyClaim,
  completeClaim,
  maskEmail,
};

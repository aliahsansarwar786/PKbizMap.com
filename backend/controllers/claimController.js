const crypto = require('crypto');
const mongoose = require('mongoose');
const ClaimRequest = require('../models/ClaimRequest');
const Business = require('../models/Business');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { getClaimVerificationEmailHtml } = require('../utils/emailTemplates');
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

  let targetEmail = '';
  if (emailOption === 'registered') {
    if (!business.email || !business.email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'This listing does not have a registered business email. Please use direct official email.',
      });
    }
    targetEmail = business.email.trim().toLowerCase();
  } else if (emailOption === 'direct') {
    if (!directEmail || !/^\S+@\S+\.\S+$/.test(directEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid direct official / corporate email address.',
      });
    }
    targetEmail = directEmail.trim().toLowerCase();
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please select an email verification option.',
    });
  }

  // Safety: only ONE active pending claim per business at a time.
  // Invalidate any existing pending requests for this business.
  await ClaimRequest.updateMany(
    { business: business._id, status: 'pending' },
    { status: 'expired' }
  );

  // Generate 6-digit numeric verification code and random token
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiresAtCode = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  const expiresAtToken = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const claimRequest = await ClaimRequest.create({
    business: business._id,
    claimantName: claimantName.trim(),
    chosenEmail: targetEmail,
    phone: phone.trim(),
    codeHash,
    tokenHash,
    expiresAtCode,
    expiresAtToken,
    status: 'pending',
    ipAddress: getClientIp(req),
  });

  const frontendUrl = getFrontendUrl();
  const verifyUrl = `${frontendUrl}/claim/verify?token=${token}`;

  // Send ONE email with both 6-digit code and 1-click verification link
  const emailHtml = getClaimVerificationEmailHtml({
    businessTitle: business.title,
    claimantName: claimantName.trim(),
    code,
    verifyUrl,
  });

  await sendEmail({
    to: targetEmail,
    subject: `[Verification] Claim Listing "${business.title}" on BizPrimeHub`,
    html: emailHtml,
    text: `Claim Verification for ${business.title}\n\nYour 6-digit code: ${code} (expires in 30 minutes)\n\nOr click this link to verify directly: ${verifyUrl}\n\nIf you did not request this, please disregard.`,
  });

  res.status(200).json({
    success: true,
    message: 'Verification code and link sent successfully to the chosen email.',
    data: {
      claimId: claimRequest._id,
      businessId: business._id,
      slug: business.slug,
      maskedEmail: maskEmail(targetEmail),
    },
  });
});

// ─── POST /api/claims/verify ─────────────────────────────────────────────────
// Public: Verify 6-digit code OR token link
const verifyClaim = asyncHandler(async (req, res) => {
  const { token, code, email, claimId } = req.body;

  let claim = null;

  if (token && token.trim()) {
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    claim = await ClaimRequest.findOne({
      tokenHash,
      status: { $in: ['pending', 'verified'] },
      expiresAtToken: { $gt: new Date() },
    }).populate('business', 'title slug category address isClaimed claimed');
  } else if (code && code.trim()) {
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    const query = {
      codeHash,
      status: { $in: ['pending', 'verified'] },
      expiresAtCode: { $gt: new Date() },
    };
    if (claimId && mongoose.Types.ObjectId.isValid(claimId)) {
      query._id = claimId;
    }
    if (email && email.trim()) {
      query.chosenEmail = email.trim().toLowerCase();
    }
    claim = await ClaimRequest.findOne(query).populate('business', 'title slug category address isClaimed claimed');
  }

  if (!claim) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code or link. Please submit a new claim request.',
    });
  }

  if (claim.business?.isClaimed || claim.business?.claimed) {
    return res.status(400).json({
      success: false,
      message: 'This business has already been claimed.',
    });
  }

  // Mark request as verified if still pending
  if (claim.status === 'pending') {
    claim.status = 'verified';
    claim.verifiedAt = new Date();
    await claim.save();
  }

  res.status(200).json({
    success: true,
    message: 'Claim request verified successfully.',
    data: {
      claimId: claim._id,
      chosenEmail: claim.chosenEmail,
      claimantName: claim.claimantName,
      business: claim.business,
      status: claim.status,
    },
  });
});

// ─── POST /api/claims/complete ───────────────────────────────────────────────
// Protected: Complete claim with authenticated account matching chosenEmail
const completeClaim = asyncHandler(async (req, res) => {
  const { claimId, token, code } = req.body;

  let claim = null;
  if (claimId && mongoose.Types.ObjectId.isValid(claimId)) {
    claim = await ClaimRequest.findById(claimId).populate('business');
  } else if (token && token.trim()) {
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    claim = await ClaimRequest.findOne({ tokenHash }).populate('business');
  } else if (code && code.trim()) {
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    claim = await ClaimRequest.findOne({ codeHash }).populate('business');
  }

  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Claim request not found.',
    });
  }

  if (claim.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'This claim request has already been completed.',
    });
  }

  const business = await Business.findById(claim.business._id || claim.business);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  if (business.isClaimed || business.claimed) {
    return res.status(400).json({
      success: false,
      message: 'This business has already been claimed.',
    });
  }

  // Check that the currently authenticated user's email matches the verified claim email
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const claimEmail = (claim.chosenEmail || '').trim().toLowerCase();

  if (userEmail !== claimEmail) {
    return res.status(403).json({
      success: false,
      message: `Please log in or register with the verified email address (${claim.chosenEmail}) to complete claiming this business. Currently logged in as ${req.user.email}.`,
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

  res.status(200).json({
    success: true,
    message: 'Ownership verified! You now own this listing.',
    data: {
      business,
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

const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Business = require('../models/Business');
const Review = require('../models/Review');
const PaymentSetting = require('../models/PaymentSetting');
const SpamBlockedEmail = require('../models/SpamBlockedEmail');
const EmailLog = require('../models/EmailLog');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const escapeRegex = require('../utils/escapeRegex');
const sendEmail = require('../utils/sendEmail');
const {
  getClaimApprovedEmailHtml,
  getClaimRejectedEmailHtml,
  getSpamNoticeHtml,
  getUnspamNoticeHtml,
  getAdminManualEmailHtml,
} = require('../utils/emailTemplates');
const getFrontendUrl = require('../utils/getFrontendUrl');
const { validate, objectIdValidator, updateBusinessValidator } = require('../utils/validators');
const { logActivity } = require('../utils/activityLogger');

const isValidHttpUrl = (str) => {
  if (!str || typeof str !== 'string') return true;
  const trimmed = str.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
// Admin: Application statistics
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    totalReviews,
    recentBusinesses,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    Business.countDocuments(),
    Business.countDocuments({ isApproved: false }),
    Business.countDocuments({ isApproved: true }),
    Review.countDocuments(),
    Business.find().sort('-createdAt').limit(5).populate('owner', 'name email').lean(),
    User.find().sort('-createdAt').limit(5).lean(),
  ]);

  // Storage Stats
  const mongoose = require('mongoose');
  let dbSizeMB = 0;
  try {
    const dbStats = await mongoose.connection.db.stats();
    dbSizeMB = Number((dbStats.storageSize / (1024 * 1024)).toFixed(2));
  } catch (err) {}

  const dbLimitMB = 512; // Mongo M0 Free Tier

  // Cloudinary Stats
  let cloudinaryUsage = { usedCredits: 0, maxCredits: 25, percentage: 0 };
  try {
    const usage = await cloudinary.api.usage();
    if (usage && usage.credits) {
      cloudinaryUsage.usedCredits = Math.max(0, usage.credits.usage || 0);
      cloudinaryUsage.maxCredits = usage.credits.limit || 25;
      const rawPercent = usage.credits.used_percent;
      const validPercent =
        typeof rawPercent === 'number' && Number.isFinite(rawPercent)
          ? Math.min(100, Math.max(0, rawPercent))
          : 0;
      cloudinaryUsage.percentage = validPercent;
    }
  } catch (err) {
    console.error("Cloudinary usage fetch error:", err);
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved.',
    data: {
      stats: {
        totalUsers,
        totalBusinesses,
        pendingBusinesses,
        approvedBusinesses,
        totalReviews,
        limits: {
          businesses: {
            used: totalBusinesses,
            max: null,
            percentage: null,
          },
          database: {
            usedMB: dbSizeMB,
            maxMB: dbLimitMB,
            percentage: ((dbSizeMB / dbLimitMB) * 100).toFixed(1),
          },
          cloudinary: {
            usedCredits: cloudinaryUsage.usedCredits,
            maxCredits: cloudinaryUsage.maxCredits,
            percentage: cloudinaryUsage.percentage.toFixed(1),
          }
        }
      },
      recentBusinesses,
      recentUsers,
    },
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Admin: Get all users with pagination
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (role && ['user', 'admin', 'subadmin'].includes(role)) {
    queryObj.role = role;
  }
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    queryObj.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(queryObj).sort('-createdAt').skip(skip).limit(limitNum).lean(),
    User.countDocuments(queryObj),
  ]);

  const usersWithCounts = await Promise.all(
    users.map(async (u) => {
      const [businessCount, reviewCount] = await Promise.all([
        Business.countDocuments({ owner: u._id }),
        Review.countDocuments({ user: u._id }),
      ]);
      return {
        ...u,
        businessCount,
        reviewCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully.',
    data: {
      users: usersWithCounts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── GET /api/admin/businesses ────────────────────────────────────────────────
// Admin: Get all businesses (approved + unapproved)
const getAllBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isApproved, category, country, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const andConditions = [];
  if (isApproved !== undefined && isApproved !== '') {
    andConditions.push({ isApproved: isApproved === 'true' });
  }
  if (category && category.trim()) {
    andConditions.push({ category: category.trim() });
  }
  if (country && country.trim() && country.trim().toLowerCase() !== 'all') {
    const c = country.trim();
    if (c.toLowerCase() === 'pakistan') {
      // Include explicit Pakistan OR legacy records where country is missing/null/empty
      andConditions.push({
        $or: [
          { 'address.country': 'Pakistan' },
          { 'address.country': { $exists: false } },
          { 'address.country': null },
          { 'address.country': '' },
        ],
      });
    } else {
      // For UAE, USA, or other: strict match only
      andConditions.push({ 'address.country': c });
    }
  }
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    andConditions.push({
      $or: [
        { title: { $regex: safeSearch, $options: 'i' } },
        { 'address.city': { $regex: safeSearch, $options: 'i' } },
      ],
    });
  }

  const queryObj = andConditions.length > 1 ? { $and: andConditions } : (andConditions[0] || {});

  const [businesses, total] = await Promise.all([
    Business.find(queryObj)
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Businesses retrieved successfully.',
    data: {
      businesses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── GET /api/admin/businesses/pending ────────────────────────────────────────
// Admin: Get pending businesses specifically
const getPendingBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [businesses, total] = await Promise.all([
    Business.find({ isApproved: false })
      .populate('owner', '_id name email isSpam spamReason')
      .sort('createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments({ isApproved: false }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Pending businesses retrieved successfully.',
    data: {
      businesses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── PATCH /api/admin/businesses/:id/approve ──────────────────────────────────
// Admin: Approve a business listing
const approveBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id).populate('owner', 'name email isSpam');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Enforcement: Reject approval if business owner is flagged as spam
    const ownerDoc = business.owner && business.owner.isSpam !== undefined
      ? business.owner
      : (business.owner ? await User.findById(business.owner).select('isSpam') : null);

    if (ownerDoc?.isSpam) {
      return res.status(403).json({
        success: false,
        message: 'Cannot approve listing: the business owner has been flagged as spam.',
      });
    }

    // FIX 4: approveBusiness must require paymentStatus === 'verified' whenever the
    // applicable listing fee for the listing's country is greater than zero
    const paymentSetting = await PaymentSetting.getSettings();
    if (!paymentSetting) {
      return res.status(503).json({
        success: false,
        message: 'Payment settings are currently unavailable. Approval is temporarily blocked.',
      });
    }

    if (paymentSetting.isEnabled) {
      const targetCountry = business.address?.country || 'Pakistan';
      let effectiveFee;
      let feeInfo;
      try {
        feeInfo = paymentSetting.getFeeForCountry
          ? paymentSetting.getFeeForCountry(targetCountry)
          : (paymentSetting.fees?.[targetCountry] || { amount: paymentSetting.feeAmount });
        const rawAmount = feeInfo && typeof feeInfo === 'object' ? feeInfo.amount : feeInfo;
        const parsedFee = (rawAmount === null || rawAmount === undefined || typeof rawAmount === 'object' || (typeof rawAmount === 'string' && rawAmount.trim() === ''))
          ? NaN
          : Number(rawAmount);
        if (!Number.isFinite(parsedFee) || parsedFee < 0) {
          throw new Error('Corrupt fee configuration');
        }
        effectiveFee = parsedFee;
      } catch (feeErr) {
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Approval is temporarily blocked.',
        });
      }

      if (!Number.isFinite(effectiveFee) || effectiveFee < 0) {
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Approval is temporarily blocked.',
        });
      }
      if (effectiveFee > 0) {
        if (business.paymentStatus !== 'verified') {
          return res.status(400).json({
            success: false,
            message: `Cannot approve listing: payment receipt must be verified first for ${targetCountry} (fee: ${feeInfo.symbol || ''}${effectiveFee}).`,
          });
        }
        if ((Number(business.paymentAmount) || 0) < effectiveFee) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve listing: verified payment amount (${business.paymentAmount}) is less than the fee for ${targetCountry} (${feeInfo.symbol || ''}${effectiveFee}).`,
          });
        }
      }
    }

    business.isApproved = true;
    business.hiddenBySpam = false;
    await business.save();

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'approve_business',
      targetType: 'business',
      targetId: business._id,
      targetLabel: business.title,
      details: 'Approved listing',
    });

    res.status(200).json({
      success: true,
      message: `"${business.title}" has been approved and is now publicly visible.`,
      data: { business },
    });
  }),
];

// ─── PATCH /api/admin/businesses/:id/reject ───────────────────────────────────
// Admin: Reject a business listing (keeps it in DB as unapproved)
const rejectBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, hiddenBySpam: false },
      { new: true }
    ).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'reject_business',
      targetType: 'business',
      targetId: business._id,
      targetLabel: business.title,
      details: req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : 'Rejected listing',
    });

    res.status(200).json({
      success: true,
      message: `"${business.title}" has been rejected.`,
      data: { business },
    });
  }),
];

// ─── DELETE /api/admin/businesses/:id ────────────────────────────────────────
// Admin: Hard delete any business
const adminDeleteBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    const businessTitle = business.title;
    const businessId = business._id;

    // Delete all Cloudinary images and receipt
    const deletePromises = business.images.map((img) =>
      cloudinary.uploader.destroy(img.publicId).catch((err) => {
        console.error(`Failed to delete image ${img.publicId}:`, err.message);
      })
    );
    if (business.paymentReceipt?.publicId) {
      deletePromises.push(
        cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
          console.error(`Failed to delete receipt ${business.paymentReceipt.publicId}:`, err.message);
        })
      );
    }
    await Promise.all(deletePromises);

    // Delete all reviews
    await Review.deleteMany({ business: business._id });

    // Delete all claim requests for this business
    const ClaimRequest = require('../models/ClaimRequest');
    await ClaimRequest.deleteMany({ business: business._id });

    await Business.findByIdAndDelete(req.params.id);

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'delete_business',
      targetType: 'business',
      targetId: businessId,
      targetLabel: businessTitle,
      details: 'Deleted business listing',
    });

    res.status(200).json({
      success: true,
      message: 'Business and all associated data deleted successfully.',
    });
  }),
];

// ─── PATCH /api/admin/users/:id/role ─────────────────────────────────────────
// Admin: Change a user's role
const updateUserRole = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const { role, permissions } = req.body;
    if (!role || !['user', 'admin', 'subadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be "user", "admin", or "subadmin".',
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Operational lockout guard: block demoting the LAST remaining admin
    if (targetUser.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last remaining admin.',
        });
      }
    }

    targetUser.role = role;
    if (role === 'subadmin') {
      targetUser.permissions = {
        canApproveListings: Boolean(permissions?.canApproveListings),
        canDeleteListings: Boolean(permissions?.canDeleteListings),
        canModerateReviews: Boolean(permissions?.canModerateReviews),
      };
    } else {
      targetUser.permissions = {
        canApproveListings: false,
        canDeleteListings: false,
        canModerateReviews: false,
      };
    }

    await targetUser.save();

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'change_role',
      targetType: 'user',
      targetId: targetUser._id,
      targetLabel: `${targetUser.name} (${targetUser.email})`,
      details: `Changed role to ${role}`,
    });

    res.status(200).json({
      success: true,
      message: `User role updated to "${role}" successfully.`,
      data: { user: targetUser },
    });
  }),
];

// ─── PATCH /api/admin/users/:id/permissions ──────────────────────────────────
// Admin: Update permissions for a subadmin user
const updateUserPermissions = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Permissions object is required.',
      });
    }

    // Prevent editing own permissions
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot edit your own permissions.',
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.role !== 'subadmin') {
      return res.status(400).json({
        success: false,
        message: 'Permissions can only be updated for subadmin accounts.',
      });
    }

    targetUser.permissions = {
      canApproveListings: Boolean(permissions.canApproveListings),
      canDeleteListings: Boolean(permissions.canDeleteListings),
      canModerateReviews: Boolean(permissions.canModerateReviews),
    };

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Sub-admin permissions updated successfully.',
      data: { user: targetUser },
    });
  }),
];

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
// Admin: Delete a user and all their data
const deleteUser = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    // Prevent self-deletion
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Operational lockout guard: block deleting the LAST remaining admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last remaining admin.',
        });
      }
    }

    // Delete user's avatar from Cloudinary
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId).catch((err) => {
        console.error('Failed to delete avatar:', err.message);
      });
    }

    // Delete user's businesses and their images + payment receipts
    const userBusinesses = await Business.find({ owner: req.params.id });
    for (const business of userBusinesses) {
      for (const img of business.images) {
        await cloudinary.uploader.destroy(img.publicId).catch((err) => {
          console.error(`Failed to delete image ${img.publicId}:`, err.message);
        });
      }
      if (business.paymentReceipt?.publicId) {
        await cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
          console.error(`Failed to delete receipt ${business.paymentReceipt.publicId}:`, err.message);
        });
      }
    }
    await Business.deleteMany({ owner: req.params.id });

    // Delete user's reviews
    await Review.deleteMany({ user: req.params.id });

    // Delete claims where claimedBy is this user, and claims for the user's businesses
    const ClaimRequest = require('../models/ClaimRequest');
    await ClaimRequest.deleteMany({ claimedBy: req.params.id });
    if (userBusinesses && userBusinesses.length > 0) {
      await ClaimRequest.deleteMany({ business: { $in: userBusinesses.map((b) => b._id) } });
    }

    // If the deleted user was spam-flagged, record their email in the blocklist collection
    if (user.isSpam && user.email) {
      const normalizedEmail = user.email.toLowerCase().trim();
      await SpamBlockedEmail.findOneAndUpdate(
        { email: normalizedEmail },
        { email: normalizedEmail },
        { upsert: true, new: true }
      );
    }

    await User.findByIdAndDelete(req.params.id);

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'delete_user',
      targetType: 'user',
      targetId: user._id,
      targetLabel: `${user.name} (${user.email})`,
      details: 'Deleted user and associated data',
    });

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully.',
    });
  }),
];

// ─── PATCH /api/admin/users/:id/spam ─────────────────────────────────────────
// Main Admin: Flag a user as spam, hide approved listings, send notice
const spamUser = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    // Refuse self-flagging
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag your own account as spam.',
      });
    }

    // Reason is REQUIRED, short text, max 200 chars, trimmed
    const rawReason = req.body?.reason;
    if (!rawReason || typeof rawReason !== 'string' || !rawReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Spam reason is required.',
      });
    }

    const trimmedReason = rawReason.trim();
    if (trimmedReason.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Spam reason must be at most 200 characters.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If user is already flagged -> 400
    if (user.isSpam) {
      return res.status(400).json({
        success: false,
        message: 'User is already flagged as spam.',
      });
    }

    // Refuse flagging the last remaining admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot flag the last remaining admin as spam.',
        });
      }
    }

    // Effects in this order:
    // (a) set user isSpam=true, spamReason=reason, spamAt=now
    user.isSpam = true;
    user.spamReason = trimmedReason;
    user.spamAt = new Date();
    await user.save();

    // (b) for every APPROVED business owned by the user: set isApproved=false AND hiddenBySpam=true
    await Business.updateMany(
      { owner: user._id, isApproved: true },
      { isApproved: false, hiddenBySpam: true }
    );

    // (c) send the spam email via the existing sendEmail (best-effort)
    try {
      const waNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '').trim();
      if (!waNum) {
        console.warn('⚠️ [User:Spam] WhatsApp number is not configured in environment variables.');
      }
      const contactText = waNum
        ? `\nIf you believe this was done by mistake, or if you would like to appeal this decision, please contact the website owner directly.\nWhatsApp: ${waNum}`
        : '\nIf you believe this was done by mistake, or if you would like to appeal this decision, please contact the website owner.';

      await sendEmail({
        to: user.email,
        subject: 'Notice: Your BizPrimeHub Account Has Been Flagged',
        html: getSpamNoticeHtml({
          name: user.name,
          reason: trimmedReason,
        }),
        text: `Hello ${user.name || 'User'},\n\nYour account has been flagged as spam and your email is blocked from BizPrimeHub.\nReason: ${trimmedReason}\n\nAny active business listings associated with your account have been hidden.\n${contactText}\n\nThank you,\nBizPrimeHub Team`,
        type: 'spam',
        sentBy: req.user._id,
      });
    } catch (emailErr) {
      console.error('⚠️ [User:Spam] Non-fatal error sending spam notice email:', emailErr.message);
    }

    // (d) return the updated user
    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'spam_user',
      targetType: 'user',
      targetId: user._id,
      targetLabel: `${user.name} (${user.email})`,
      details: trimmedReason,
    });

    res.status(200).json({
      success: true,
      message: 'User has been flagged as spam successfully.',
      data: { user },
    });
  }),
];

// ─── PATCH /api/admin/users/:id/unspam ───────────────────────────────────────
// Main Admin: Un-flag a user, restore listings hidden by spam action, send notice
const unspamUser = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If the user is not flagged -> 400
    if (!user.isSpam) {
      return res.status(400).json({
        success: false,
        message: 'User is not flagged as spam.',
      });
    }

    const paymentSetting = await PaymentSetting.getSettings();
    if (!paymentSetting) {
      return res.status(503).json({
        success: false,
        message: 'Payment settings are currently unavailable. Un-spam is temporarily blocked.',
      });
    }

    // Effects in this order:
    // (a) set isSpam=false, clear spamReason and spamAt
    user.isSpam = false;
    user.spamReason = '';
    user.spamAt = null;
    await user.save();

    // (b) restore owner's businesses with hiddenBySpam=true
    const hiddenBusinesses = await Business.find({ owner: user._id, hiddenBySpam: true });
    const paymentsOn = Boolean(paymentSetting && paymentSetting.isEnabled);

    let restoredCount = 0;
    let heldForPaymentCount = 0;

    for (const b of hiddenBusinesses) {
      if (!paymentsOn) {
        b.isApproved = true;
        b.hiddenBySpam = false;
        await b.save();
        restoredCount++;
      } else {
        const country = b.address?.country || 'Pakistan';
        let fee;
        let feeInfo;
        try {
          feeInfo = paymentSetting.getFeeForCountry
            ? paymentSetting.getFeeForCountry(country)
            : (paymentSetting.fees?.[country] || { amount: paymentSetting.feeAmount });
          const rawAmount = feeInfo && typeof feeInfo === 'object' ? feeInfo.amount : feeInfo;
          const parsedFee = (rawAmount === null || rawAmount === undefined || typeof rawAmount === 'object' || (typeof rawAmount === 'string' && rawAmount.trim() === ''))
            ? NaN
            : Number(rawAmount);
          if (!Number.isFinite(parsedFee) || parsedFee < 0) {
            throw new Error('Corrupt fee configuration');
          }
          fee = parsedFee;
        } catch (feeErr) {
          b.isApproved = false;
          b.hiddenBySpam = false;
          b.paymentStatus = 'pending';
          await b.save();
          heldForPaymentCount++;
          continue;
        }

        if (!Number.isFinite(fee) || fee < 0) {
          b.isApproved = false;
          b.hiddenBySpam = false;
          b.paymentStatus = 'pending';
          await b.save();
          heldForPaymentCount++;
          continue;
        }

        if (fee > 0 && !(b.paymentStatus === 'verified' && Number(b.paymentAmount) >= fee)) {
          b.isApproved = false;
          b.hiddenBySpam = false;
          b.paymentStatus = 'pending';
          await b.save();
          heldForPaymentCount++;
        } else if (fee === 0) {
          b.isApproved = true;
          b.hiddenBySpam = false;
          b.paymentAmount = 0;
          b.paymentStatus = 'none';
          await b.save();
          restoredCount++;
        } else {
          b.isApproved = true;
          b.hiddenBySpam = false;
          await b.save();
          restoredCount++;
        }
      }
    }

    // (c) send the un-spam email (best-effort)
    try {
      const waNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '').trim();
      if (!waNum) {
        console.warn('⚠️ [User:Unspam] WhatsApp number is not configured in environment variables.');
      }
      const contactText = waNum
        ? `\nIf you encounter any issues or have any questions, you can contact our support team:\nWhatsApp: ${waNum}`
        : '\nIf you encounter any issues or have any questions, please contact our support team.';

      await sendEmail({
        to: user.email,
        subject: 'Notice: Your BizPrimeHub Account Has Been Restored',
        html: getUnspamNoticeHtml({
          name: user.name,
        }),
        text: `Hello ${user.name || 'User'},\n\nYour account has been restored and you can use BizPrimeHub normally again. Any business listings hidden due to the spam flag have been reactivated.\n${contactText}\n\nThank you,\nBizPrimeHub Team`,
        type: 'unspam',
        sentBy: req.user._id,
      });
    } catch (emailErr) {
      console.error('⚠️ [User:Unspam] Non-fatal error sending un-spam notice email:', emailErr.message);
    }

    // (d) return the updated user
    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'unspam_user',
      targetType: 'user',
      targetId: user._id,
      targetLabel: `${user.name} (${user.email})`,
      details: `Account unflagged. Listings restored live: ${restoredCount}, held pending payment: ${heldForPaymentCount}`,
    });

    res.status(200).json({
      success: true,
      message: 'User has been un-flagged successfully.',
      data: { user },
    });
  }),
];

// ─── GET /api/admin/emails/stats ──────────────────────────────────────────────
// Main Admin: Email metrics (total all-time and today)
const getEmailStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, today] = await Promise.all([
    EmailLog.countDocuments(),
    EmailLog.countDocuments({ createdAt: { $gte: startOfToday } }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Email statistics retrieved successfully.',
    data: {
      total,
      today,
    },
    total,
    today,
  });
});

// ─── GET /api/admin/emails/log ────────────────────────────────────────────────
// Main Admin: Paginated sent email log
const getEmailLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    EmailLog.find()
      .populate('sentBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    EmailLog.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Email logs retrieved successfully.',
    data: {
      logs,
      emailLogs: logs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── POST /api/admin/emails/send ──────────────────────────────────────────────
// Main Admin: Manually send a direct branded email to a single recipient
const sendAdminEmail = asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body || {};

  // All three required, trimmed, non-empty
  if (!to || typeof to !== 'string' || !to.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Recipient email address is required.',
    });
  }

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email subject is required.',
    });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email message is required.',
    });
  }

  const trimmedTo = to.trim();
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  // Validate single email address: reject arrays, commas, semicolons, whitespace, no bulk sending
  if (Array.isArray(to) || trimmedTo.includes(',') || trimmedTo.includes(';') || /\s/.test(trimmedTo)) {
    return res.status(400).json({
      success: false,
      message: 'Only a single recipient email address is allowed. Bulk sending is not permitted.',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedTo)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid recipient email address.',
    });
  }

  if (trimmedSubject.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Subject must be at most 200 characters.',
    });
  }

  if (trimmedMessage.length > 5000) {
    return res.status(400).json({
      success: false,
      message: 'Message must be at most 5000 characters.',
    });
  }

  const normalizedTo = trimmedTo.toLowerCase();

  const html = getAdminManualEmailHtml({
    subject: trimmedSubject,
    message: trimmedMessage,
  });

  const sent = await sendEmail({
    to: normalizedTo,
    subject: trimmedSubject,
    html,
    text: trimmedMessage,
    type: 'manual',
    sentBy: req.user._id,
  });

  // Fetch or construct the log entry
  let log = await EmailLog.findOne({
    to: normalizedTo,
    type: 'manual',
    sentBy: req.user._id,
  })
    .sort('-createdAt')
    .lean();

  if (!log) {
    await new Promise((r) => setTimeout(r, 60));
    log = await EmailLog.findOne({
      to: normalizedTo,
      type: 'manual',
      sentBy: req.user._id,
    })
      .sort('-createdAt')
      .lean();
  }

  const logEntry = log || {
    to: normalizedTo,
    subject: trimmedSubject,
    type: 'manual',
    status: sent ? 'sent' : 'failed',
    sentBy: req.user._id,
    createdAt: new Date(),
  };

  res.status(200).json({
    success: true,
    message: sent ? 'Email sent successfully.' : 'Email queued / processed.',
    data: {
      sent,
      log: logEntry,
    },
    log: logEntry,
  });
});

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────
// Admin: Get all reviews with search and pagination
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (search && search.trim()) {
    queryObj.comment = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  const [reviews, total] = await Promise.all([
    Review.find(queryObj)
      .populate('user', 'name email')
      .populate('business', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Reviews retrieved successfully.',
    data: {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── DELETE /api/admin/reviews/:id ───────────────────────────────────────────
// Admin: Delete a review (triggers post findOneAndDelete hook to recalc ratings)
const adminDeleteReview = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const review = await Review.findById(req.params.id).populate('business', 'title');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const businessTitle = review.business?.title || 'Review';
    await Review.findByIdAndDelete(req.params.id);

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'delete_review',
      targetType: 'review',
      targetId: review._id,
      targetLabel: businessTitle,
      details: review.comment ? String(review.comment).slice(0, 100) : 'Deleted review',
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully and ratings updated.',
    });
  }),
];

// ─── PATCH /api/admin/businesses/:id ─────────────────────────────────────────
// Admin: Edit a business's core details without resetting approval or payment
const adminUpdateBusiness = [
  ...objectIdValidator('id'),
  ...updateBusinessValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // FIX 5: Sub-admin must NOT be able to change business's registered email
    if (req.body.email !== undefined) {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Changing a business registered email requires the main admin role.',
        });
      }
      business.email = req.body.email;
    }

    // Allowed fields: email is handled strictly above with the main-admin role check
    const allowedScalarFields = [
      'title',
      'description',
      'category',
      'subcategory',
      'contactPerson',
      'phone',
      'whatsapp',
      'website',
    ];
    allowedScalarFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    });

    // Validate website scheme (http/https only)
    if (business.website && !isValidHttpUrl(business.website)) {
      return res.status(400).json({
        success: false,
        message: 'Website must be a valid URL starting with http:// or https://',
      });
    }

    if (req.body.openingHours !== undefined) {
      if (typeof req.body.openingHours === 'string') {
        try {
          business.openingHours = JSON.parse(req.body.openingHours);
        } catch {
          business.openingHours = null;
        }
      } else {
        business.openingHours = req.body.openingHours;
      }
    }

    if (req.body.socialLinks !== undefined) {
      let parsedLinks = null;
      if (typeof req.body.socialLinks === 'string') {
        try {
          parsedLinks = JSON.parse(req.body.socialLinks);
        } catch {
          return res.status(400).json({
            success: false,
            message: 'Invalid socialLinks format.',
          });
        }
      } else if (typeof req.body.socialLinks === 'object' && req.body.socialLinks !== null) {
        parsedLinks = req.body.socialLinks;
      }

      if (parsedLinks) {
        for (const [key, val] of Object.entries(parsedLinks)) {
          if (val && !isValidHttpUrl(val)) {
            return res.status(400).json({
              success: false,
              message: `${key} must be a valid URL starting with http:// or https://`,
            });
          }
        }
        business.socialLinks = parsedLinks;
      }
    }

    const oldCountry = business.address?.country || 'Pakistan';

    if (req.body.address && typeof req.body.address === 'object') {
      if (req.body.address.country !== undefined) business.address.country = req.body.address.country;
      if (req.body.address.street !== undefined) business.address.street = req.body.address.street;
      if (req.body.address.area !== undefined) business.address.area = req.body.address.area;
      if (req.body.address.city !== undefined) business.address.city = req.body.address.city;
      if (req.body.address.zipCode !== undefined) business.address.zipCode = req.body.address.zipCode;
    } else {
      if (req.body.country !== undefined) business.address.country = req.body.country;
      if (req.body.street !== undefined) business.address.street = req.body.street;
      if (req.body.area !== undefined) business.address.area = req.body.area;
      if (req.body.city !== undefined) business.address.city = req.body.city;
      if (req.body.zipCode !== undefined) business.address.zipCode = req.body.zipCode;
    }

    const newCountry = business.address?.country || 'Pakistan';
    const countryChanged = newCountry.trim().toLowerCase() !== oldCountry.trim().toLowerCase();

    if (countryChanged) {
      const paymentSetting = await PaymentSetting.getSettings();
      if (paymentSetting && paymentSetting.isEnabled) {
        let newFee;
        let feeInfo;
        try {
          feeInfo = paymentSetting.getFeeForCountry
            ? paymentSetting.getFeeForCountry(newCountry.trim())
            : (paymentSetting.fees?.[newCountry.trim()] || { amount: paymentSetting.feeAmount });
          const rawAmount = feeInfo && typeof feeInfo === 'object' ? feeInfo.amount : feeInfo;
          const parsedFee = (rawAmount === null || rawAmount === undefined || typeof rawAmount === 'object' || (typeof rawAmount === 'string' && rawAmount.trim() === ''))
            ? NaN
            : Number(rawAmount);
          if (!Number.isFinite(parsedFee) || parsedFee < 0) {
            throw new Error('Corrupt fee configuration');
          }
          newFee = parsedFee;
        } catch (feeErr) {
          return res.status(503).json({
            success: false,
            message: 'Payment settings are currently unavailable. Update is temporarily blocked.',
          });
        }

        if (!Number.isFinite(newFee) || newFee < 0) {
          return res.status(503).json({
            success: false,
            message: 'Payment settings are currently unavailable. Update is temporarily blocked.',
          });
        }

        const wasVerifiedAndCovered = business.paymentStatus === 'verified' && (Number(business.paymentAmount) || 0) >= newFee;

        if (newFee === 0) {
          business.paymentAmount = 0;
          business.paymentStatus = 'none';
          if (business.paymentReceipt?.publicId) {
            cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
              console.error('Failed to delete receipt from Cloudinary on country change:', err.message);
            });
          }
          business.paymentReceipt = { url: '', publicId: '' };
        } else {
          business.paymentAmount = newFee;
          if (!wasVerifiedAndCovered) {
            business.paymentStatus = 'pending';
            business.isApproved = false;
            if (business.paymentReceipt?.publicId) {
              cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
                console.error('Failed to delete receipt from Cloudinary on country change:', err.message);
              });
            }
            business.paymentReceipt = { url: '', publicId: '' };
          }
        }
      }
    }

    // FORBIDDEN fields: owner, averageRating, reviewCount, images (payment fields managed via country-change rules above)
    // None of these are modified directly via request body.
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Business updated successfully by admin.',
      data: { business },
    });
  }),
];

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
// Admin: Get payment history for listings with payment receipts
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, paymentStatus, search } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {
    'paymentReceipt.url': { $exists: true, $ne: '' },
  };

  if (paymentStatus && ['none', 'pending', 'verified', 'rejected'].includes(paymentStatus)) {
    queryObj.paymentStatus = paymentStatus;
  }

  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ],
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    queryObj.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { owner: { $in: userIds } },
    ];
  }

  const [payments, total] = await Promise.all([
    Business.find(queryObj)
      .select('_id title owner paymentAmount paymentStatus paymentReceipt.url createdAt isApproved')
      .populate('owner', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Payment history retrieved successfully.',
    data: {
      payments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── GET /api/admin/businesses/:id ──────────────────────────────────────────
// Admin: Get single business by ID (even if unapproved)
const getAdminBusinessById = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id).populate('owner', 'name email');

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Business retrieved successfully.',
      data: { business },
    });
  }),
];

// ─── DELETE /api/admin/businesses/:id/receipt ────────────────────────────────
// Admin: Delete a business's uploaded payment receipt
const deleteBusinessReceipt = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (business.paymentReceipt?.publicId) {
      await cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
        console.error('Failed to delete receipt from Cloudinary:', err.message);
      });
    }

    business.paymentReceipt = { url: '', publicId: '' };
    business.paymentStatus = 'none';
    business.paymentAmount = 0;
    business.isApproved = false;
    await business.save();

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: 'delete_receipt',
      targetType: 'business',
      targetId: business._id,
      targetLabel: business.title,
      details: 'Deleted payment receipt, unapproved listing',
    });

    res.status(200).json({
      success: true,
      message: 'Payment receipt deleted successfully.',
      data: { business },
    });
  }),
];

// ─── PATCH /api/admin/businesses/:id/payment ─────────────────────────────────
// Main Admin ONLY: Verify or reject a business listing's payment receipt
const updateBusinessPaymentStatus = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const { status } = req.body;
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Allowed values: verified, rejected.',
      });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (status === 'verified') {
      if (typeof business.paymentReceipt?.url !== 'string' || !business.paymentReceipt.url.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot verify payment: no payment receipt uploaded for this listing.',
        });
      }

      const paymentSetting = await PaymentSetting.getSettings();
      if (!paymentSetting) {
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Verification is temporarily blocked.',
        });
      }

      const targetCountry = business.address?.country || 'Pakistan';
      let verifiedFee;
      let feeInfo;
      try {
        feeInfo = paymentSetting.getFeeForCountry
          ? paymentSetting.getFeeForCountry(targetCountry)
          : (paymentSetting.fees?.[targetCountry] || { amount: paymentSetting.feeAmount });
        const rawAmount = feeInfo && typeof feeInfo === 'object' ? feeInfo.amount : feeInfo;
        const parsedFee = (rawAmount === null || rawAmount === undefined || typeof rawAmount === 'object' || (typeof rawAmount === 'string' && rawAmount.trim() === ''))
          ? NaN
          : Number(rawAmount);
        if (!Number.isFinite(parsedFee) || parsedFee < 0) {
          throw new Error('Corrupt fee configuration');
        }
        verifiedFee = parsedFee;
      } catch (feeErr) {
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Verification is temporarily blocked.',
        });
      }

      if (!Number.isFinite(verifiedFee) || verifiedFee < 0) {
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Verification is temporarily blocked.',
        });
      }

      business.paymentAmount = verifiedFee;
      business.paymentStatus = 'verified';
    } else if (status === 'rejected') {
      business.paymentStatus = 'rejected';
      business.isApproved = false;
      business.paymentAmount = 0;
    }

    await business.save();

    logActivity({
      actorId: req.user?._id,
      actorName: req.user?.name,
      action: status === 'verified' ? 'verify_payment' : 'reject_payment',
      targetType: 'payment',
      targetId: business._id,
      targetLabel: business.title,
      details:
        status === 'verified'
          ? 'Payment receipt verified'
          : 'Payment receipt rejected, unapproved listing',
    });

    res.status(200).json({
      success: true,
      message: `Payment status updated to "${status}".`,
      data: { business },
    });
  }),
];

// ─── GET /api/admin/claims ──────────────────────────────────────────────────
// Admin: Get all claim requests (with full business contact info and claimant details)
const getClaimRequests = asyncHandler(async (req, res) => {
  const ClaimRequest = require('../models/ClaimRequest');
  const { page = 1, limit = 100 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100));
  const skip = (pageNum - 1) * limitNum;

  const [claims, total] = await Promise.all([
    ClaimRequest.find()
      .select('-codeHash -tokenHash -codeSalt')
      .populate('business', 'title slug phone whatsapp email address.city address.country isClaimed')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ClaimRequest.countDocuments(),
  ]);

  claims.forEach((c) => {
    delete c.codeHash;
    delete c.tokenHash;
    delete c.codeSalt;
  });

  res.status(200).json({
    success: true,
    message: 'Claim requests retrieved successfully.',
    data: {
      claims,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

// ─── PATCH /api/admin/claims/:id/approve ─────────────────────────────────────
// Admin: Approve a pending_admin claim request & transfer ownership to claimant
const approveClaimRequest = asyncHandler(async (req, res) => {
  const ClaimRequest = require('../models/ClaimRequest');

  const claim = await ClaimRequest.findById(req.params.id);
  if (!claim) {
    return res.status(404).json({ success: false, message: 'Claim request not found.' });
  }

  if (claim.status !== 'pending_admin') {
    return res.status(400).json({
      success: false,
      message: `Only claims with status "pending_admin" can be approved. Current status is "${claim.status}".`,
    });
  }

  let business = await Business.findById(claim.business);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Associated business not found.' });
  }

  // Expiry check: if the claim is pending_admin and more than 7 days have passed since verifiedAt (or createdAt if verifiedAt is missing)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const claimBaseTime = claim.verifiedAt || claim.createdAt;
  if (claimBaseTime && (Date.now() - new Date(claimBaseTime).getTime() > SEVEN_DAYS_MS)) {
    claim.status = 'expired';
    await claim.save();
    return res.status(400).json({
      success: false,
      message: 'This claim request has expired (7-day window exceeded).',
    });
  }

  // Re-validate: if claim.emailOption is 'registered', claim.chosenEmail must still equal current business.email
  if (claim.emailOption === 'registered') {
    const currentBusinessEmail = (business.email || '').trim().toLowerCase();
    const claimEmail = (claim.chosenEmail || '').trim().toLowerCase();
    if (!currentBusinessEmail || claimEmail !== currentBusinessEmail) {
      claim.status = 'expired';
      await claim.save();
      return res.status(400).json({
        success: false,
        message: 'Claim email no longer matches the business registered email.',
      });
    }
  }

  // FIX 6: Reject approval if business is already claimed
  if (business.isClaimed || business.claimed) {
    const isSelfClaim =
      (claim.claimedBy && String(business.claimedBy) === String(claim.claimedBy)) ||
      (business.claimedBy && String(business.claimedBy) === String(claim.claimedBy));
    if (!isSelfClaim) {
      return res.status(400).json({
        success: false,
        message: 'This business has already been claimed.',
      });
    }
  }

  // Find or create claimant's User account matching the verified email
  const claimantEmail = (claim.chosenEmail || '').trim().toLowerCase();
  let claimantUser = await User.findOne({ email: claimantEmail });

  if (claimantUser) {
    if (claimantUser.isSpam) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer listing: claimant account is flagged as spam.',
      });
    }
    if (!claimantUser.emailVerified) {
      claimantUser.emailVerified = true;
      await claimantUser.save();
    }
  } else {
    const tempPassword = crypto.randomBytes(16).toString('hex');
    claimantUser = await User.create({
      name: claim.claimantName || 'Business Owner',
      email: claimantEmail,
      password: tempPassword,
      role: 'user',
      emailVerified: true,
    });
  }

  // Transfer ownership & mark as claimed (atomic transaction with fallback)
  let session = null;
  let useFallback = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (sessErr) {
    console.warn('⚠️ [Claim:Approve] Transactions not supported on this MongoDB deployment, falling back to sequential saves:', sessErr.message);
    if (session) {
      try { await session.endSession(); } catch (_) {}
      session = null;
    }
    useFallback = true;
  }

  if (session) {
    try {
      // Re-check isClaimed / isSelfClaim guard inside transaction
      const txBusiness = await Business.findById(business._id).session(session);
      if (!txBusiness) {
        await session.abortTransaction();
        await session.endSession();
        return res.status(404).json({ success: false, message: 'Associated business not found.' });
      }

      if (txBusiness.isClaimed || txBusiness.claimed) {
        const isSelfClaim =
          (claim.claimedBy && String(txBusiness.claimedBy) === String(claim.claimedBy)) ||
          (txBusiness.claimedBy && String(txBusiness.claimedBy) === String(claim.claimedBy));
        if (!isSelfClaim) {
          await session.abortTransaction();
          await session.endSession();
          return res.status(400).json({
            success: false,
            message: 'This business has already been claimed.',
          });
        }
      }

      txBusiness.owner = claimantUser._id;
      txBusiness.isClaimed = true;
      txBusiness.claimed = true;
      txBusiness.claimedAt = new Date();
      txBusiness.claimedBy = claimantUser._id;
      await txBusiness.save({ session });

      claim.status = 'approved';
      claim.completedAt = new Date();
      claim.claimedBy = claimantUser._id;
      await claim.save({ session });

      // Expire/invalidate all other pending claims for the same business within transaction
      await ClaimRequest.updateMany(
        {
          business: txBusiness._id,
          _id: { $ne: claim._id },
          status: { $in: ['pending', 'pending_admin'] },
        },
        { status: 'expired' },
        { session }
      );

      await session.commitTransaction();
      await session.endSession();
      business = txBusiness;
    } catch (txErr) {
      if (session) {
        try { await session.abortTransaction(); } catch (_) {}
        try { await session.endSession(); } catch (_) {}
        session = null;
      }

      const isReplicaSetError =
        txErr.message &&
        (txErr.message.includes('replica set') ||
         txErr.message.includes('Transaction numbers') ||
         txErr.message.includes('Transactions are not supported'));

      if (isReplicaSetError) {
        console.warn('⚠️ [Claim:Approve] MongoDB transaction unsupported, falling back to sequential saves:', txErr.message);
        useFallback = true;
      } else {
        console.error('⚠️ [Claim:Approve] Failed to approve claim transfer:', txErr.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to approve claim transfer.',
        });
      }
    }
  }

  if (useFallback) {
    if (business.isClaimed || business.claimed) {
      const isSelfClaim =
        (claim.claimedBy && String(business.claimedBy) === String(claim.claimedBy)) ||
        (business.claimedBy && String(business.claimedBy) === String(claim.claimedBy));
      if (!isSelfClaim) {
        return res.status(400).json({
          success: false,
          message: 'This business has already been claimed.',
        });
      }
    }

    business.owner = claimantUser._id;
    business.isClaimed = true;
    business.claimed = true;
    business.claimedAt = new Date();
    business.claimedBy = claimantUser._id;
    await business.save();

    claim.status = 'approved';
    claim.completedAt = new Date();
    claim.claimedBy = claimantUser._id;
    await claim.save();

    // Expire/invalidate all other pending claims for the same business
    await ClaimRequest.updateMany(
      {
        business: business._id,
        _id: { $ne: claim._id },
        status: { $in: ['pending', 'pending_admin'] },
      },
      { status: 'expired' }
    );
  }

  // FIX 6: Send approval email explaining how to sign in via forgot-password OTP
  try {
    const frontendUrl = getFrontendUrl ? getFrontendUrl(req) : (process.env.FRONTEND_URL || 'https://www.bizprimehub.com');
    const forgotPasswordUrl = `${frontendUrl}/forgot-password`;
    const loginUrl = `${frontendUrl}/login`;

    await sendEmail({
      to: claimantEmail,
      subject: `Business Claim Approved: ${String(business.title || '').replace(/[\r\n]+/g, ' ').trim()}`,
      html: getClaimApprovedEmailHtml({
        claimantName: claim.claimantName,
        businessTitle: business.title,
        businessSlug: business.slug,
        forgotPasswordUrl,
        loginUrl,
      }),
      text: `Congratulations ${claim.claimantName || 'Business Owner'}!\n\nYour claim for "${business.title}" on BizPrimeHub has been approved.\n\nTo access your account, please set your password using our Forgot Password flow at: ${forgotPasswordUrl}\n\nOnce set, you can log in at: ${loginUrl}\n\nThank you,\nBizPrimeHub Team`,
    });
  } catch (emailErr) {
    console.error('⚠️ [Claim:Approve] Non-fatal error sending approval email:', emailErr.message);
  }

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'approve_claim',
    targetType: 'claim',
    targetId: claim._id,
    targetLabel: business.title,
    details: `Claim approved for ${claimantEmail}`,
  });

  res.status(200).json({
    success: true,
    message: `Claim approved successfully. Ownership of "${business.title}" has been transferred to ${claimantEmail}.`,
    data: {
      claimId: claim._id,
      businessId: business._id,
      status: claim.status,
      claimedBy: claimantUser._id,
    },
  });
});

// ─── PATCH /api/admin/claims/:id/reject ──────────────────────────────────────
// Admin: Reject a pending_admin claim request (no ownership change)
const rejectClaimRequest = asyncHandler(async (req, res) => {
  const ClaimRequest = require('../models/ClaimRequest');

  const claim = await ClaimRequest.findById(req.params.id);
  if (!claim) {
    return res.status(404).json({ success: false, message: 'Claim request not found.' });
  }

  if (claim.status !== 'pending_admin') {
    return res.status(400).json({
      success: false,
      message: `Only claims with status "pending_admin" can be rejected. Current status is "${claim.status}".`,
    });
  }

  claim.status = 'rejected';
  await claim.save();

  const business = await Business.findById(claim.business).select('title');
  const businessTitle = business?.title || 'Business';

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'reject_claim',
    targetType: 'claim',
    targetId: claim._id,
    targetLabel: businessTitle,
    details: 'Claim request rejected',
  });

  // FIX 6: Send rejection email to claimant
  try {
    const claimantEmail = (claim.chosenEmail || '').trim().toLowerCase();
    const business = await Business.findById(claim.business);
    const businessTitle = business?.title || 'Business';

    await sendEmail({
      to: claimantEmail,
      subject: `Business Claim Update: ${String(businessTitle).replace(/[\r\n]+/g, ' ').trim()}`,
      html: getClaimRejectedEmailHtml({
        claimantName: claim.claimantName,
        businessTitle,
      }),
      text: `Hello ${claim.claimantName || 'Business Owner'},\n\nYour claim request for "${businessTitle}" on BizPrimeHub could not be approved at this time.\n\nIf you have questions or additional verification documents, please contact support.\n\nThank you,\nBizPrimeHub Team`,
    });
  } catch (emailErr) {
    console.error('⚠️ [Claim:Reject] Non-fatal error sending rejection email:', emailErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Claim request has been rejected.',
    data: {
      claimId: claim._id,
      status: claim.status,
    },
  });
});

// ─── GET /api/admin/activity-log ──────────────────────────────────────────────
// Main Admin ONLY: Paginated admin activity log
const getActivityLog = asyncHandler(async (req, res) => {
  const ActivityLog = require('../models/ActivityLog');
  const { page = 1, limit = 20, action } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryObj = {};
  if (action && typeof action === 'string' && action.trim() && action !== 'all') {
    queryObj.action = action.trim();
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(queryObj)
      .populate('actor', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ActivityLog.countDocuments(queryObj),
  ]);

  res.status(200).json({
    success: true,
    message: 'Activity log retrieved successfully.',
    data: {
      logs,
      activityLogs: logs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    },
  });
});

// ─── GET /api/admin/export ───────────────────────────────────────────────────
// Main Admin ONLY: One-click full JSON backup export with strict secret exclusion
const exportBackup = asyncHandler(async (req, res) => {
  const SENSITIVE_USER_FIELDS = [
    'password',
    'emailVerificationOTP',
    'emailVerificationOTPExpires',
    'emailVerificationOTPAttempts',
    'emailVerificationOTPBlockedUntil',
    'emailVerificationLastResend',
    'resetPasswordOTP',
    'resetPasswordOTPExpires',
    'resetPasswordOTPAttempts',
    'resetPasswordOTPBlockedUntil',
    'resetPasswordLastResend',
    'resetPasswordTokenHash',
    'resetPasswordTokenExpires',
    'resetPasswordToken',
    'resetPasswordExpire',
    'passwordChangedAt',
    'loginAttempts',
    'lockUntil',
    '__v',
  ];

  // 1. Query users WITHOUT .lean() so the User model's toJSON stripping applies
  // Businesses and reviews: full documents minus __v (plain ObjectIds, no population)
  const [userDocs, rawBusinesses, rawReviews] = await Promise.all([
    User.find().sort({ _id: 1 }),
    Business.find().sort({ _id: 1 }).lean(),
    Review.find().sort({ _id: 1 }).lean(),
  ]);

  // 2. Defensively delete every secret field by name before serializing
  const sanitizedUsers = userDocs.map((doc) => {
    const obj = doc && typeof doc.toJSON === 'function' ? doc.toJSON() : (doc && typeof doc.toObject === 'function' ? doc.toObject() : { ...doc });
    for (const field of SENSITIVE_USER_FIELDS) {
      delete obj[field];
    }
    return obj;
  });

  // 3. Clean businesses minus __v
  const sanitizedBusinesses = rawBusinesses.map((biz) => {
    const { __v, ...rest } = biz;
    return rest;
  });

  // 4. Clean reviews minus __v
  const sanitizedReviews = rawReviews.map((rev) => {
    const { __v, ...rest } = rev;
    return rest;
  });

  // 5. Construct snapshot payload
  const exportedAt = new Date().toISOString();
  const payload = {
    exportedAt,
    counts: {
      users: sanitizedUsers.length,
      businesses: sanitizedBusinesses.length,
      reviews: sanitizedReviews.length,
    },
    users: sanitizedUsers,
    businesses: sanitizedBusinesses,
    reviews: sanitizedReviews,
  };

  // 6. Set response headers Content-Type and Content-Disposition (UTC date)
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const filename = `bizprimehub-backup-${yyyy}-${mm}-${dd}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  return res.status(200).json(payload);
});

// In-memory cache for quota endpoint (60 seconds)
let quotaCache = null;
let quotaCacheExpiry = 0;

// ─── GET /api/admin/quota ────────────────────────────────────────────────────
// Main Admin ONLY: Quota stats for business count, mongo data size, and cloudinary credits
const getQuota = asyncHandler(async (req, res) => {
  const now = Date.now();
  if (quotaCache && now < quotaCacheExpiry) {
    return res.status(200).json({
      success: true,
      data: quotaCache,
    });
  }

  let businessCount = null;
  try {
    businessCount = await Business.countDocuments();
  } catch (err) {
    console.error('Failed to get business count for quota:', err.message);
  }

  let mongoDataMB = null;
  try {
    const mongoose = require('mongoose');
    const dbStats = await mongoose.connection.db.stats();
    const rawBytes = dbStats.storageSize ?? 0;
    mongoDataMB = parseFloat((rawBytes / (1024 * 1024)).toFixed(2));
  } catch (err) {
    console.error('Failed to get db stats for quota:', err.message);
  }

  let cloudinaryCreditsUsed = null;
  try {
    const usage = await cloudinary.api.usage();
    if (usage && usage.credits && typeof usage.credits.usage === 'number') {
      cloudinaryCreditsUsed = parseFloat(Math.max(0, usage.credits.usage).toFixed(1));
    }
  } catch (err) {
    console.error('Failed to get cloudinary usage for quota:', err.message);
  }

  const result = {
    businessCount,
    mongoDataMB,
    cloudinaryCreditsUsed,
  };

  quotaCache = result;
  quotaCacheExpiry = now + 60 * 1000; // 60s TTL

  res.status(200).json({
    success: true,
    data: result,
  });
});

// ─── GET /api/admin/reports ──────────────────────────────────────────────────
// Main Admin ONLY: Real platform analytics & aggregated reports
const getReports = asyncHandler(async (req, res) => {
  const ClaimRequest = require('../models/ClaimRequest');

  // 1. Totals
  let totals = {
    users: 0,
    businesses: 0,
    pending: 0,
    approved: 0,
    hiddenBySpam: 0,
    reviews: 0,
    claims: {},
  };
  try {
    const [
      userCount,
      bizCount,
      pendingCount,
      approvedCount,
      spamCount,
      reviewCount,
      claimStats,
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Business.countDocuments().catch(() => 0),
      Business.countDocuments({ isApproved: false }).catch(() => 0),
      Business.countDocuments({ isApproved: true }).catch(() => 0),
      Business.countDocuments({ hiddenBySpam: true }).catch(() => 0),
      Review.countDocuments().catch(() => 0),
      ClaimRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).catch(() => []),
    ]);

    const claimsMap = {};
    if (Array.isArray(claimStats)) {
      claimStats.forEach((c) => {
        if (c._id) claimsMap[c._id] = c.count;
      });
    }

    totals = {
      users: userCount || 0,
      businesses: bizCount || 0,
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      hiddenBySpam: spamCount || 0,
      reviews: reviewCount || 0,
      claims: claimsMap,
    };
  } catch (err) {
    console.error('Failed to aggregate totals for reports:', err.message);
  }

  // 2. Businesses by Category (all categories present in data, sorted desc)
  let byCategory = [];
  try {
    const rawCategories = await Business.aggregate([
      { $match: { category: { $exists: true, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    byCategory = rawCategories.map((c) => ({
      category: c._id || 'Uncategorized',
      name: c._id || 'Uncategorized',
      count: c.count,
    }));
  } catch (err) {
    console.error('Failed to aggregate categories for reports:', err.message);
  }

  // 3. Businesses by Country (Pakistan/UAE/USA)
  let byCountry = [];
  try {
    const rawCountries = await Business.aggregate([
      { $match: { 'address.country': { $exists: true, $ne: '' } } },
      { $group: { _id: '$address.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    byCountry = rawCountries.map((c) => ({
      country: c._id || 'Unknown',
      name: c._id || 'Unknown',
      count: c.count,
    }));
  } catch (err) {
    console.error('Failed to aggregate countries for reports:', err.message);
  }

  // 4. Top 10 Cities
  let topCities = [];
  try {
    const rawCities = await Business.aggregate([
      { $match: { 'address.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    topCities = rawCities.map((c) => ({
      city: c._id,
      name: c._id,
      count: c.count,
    }));
  } catch (err) {
    console.error('Failed to aggregate top cities for reports:', err.message);
  }

  // Date threshold for last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // 5. Businesses by Month (last 12 months, sorted desc)
  let businessesByMonth = [];
  try {
    const rawBizByMonth = await Business.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    businessesByMonth = rawBizByMonth.map((m) => ({
      month: m._id,
      count: m.count,
    }));
  } catch (err) {
    console.error('Failed to aggregate businesses by month for reports:', err.message);
  }

  // 6. Users by Month (last 12 months, sorted desc)
  let usersByMonth = [];
  try {
    const rawUsersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    usersByMonth = rawUsersByMonth.map((m) => ({
      month: m._id,
      count: m.count,
    }));
  } catch (err) {
    console.error('Failed to aggregate users by month for reports:', err.message);
  }

  // 7. Receipts by paymentStatus + sum of paymentAmount for verified only
  let payments = {
    totalReceipts: 0,
    byStatus: { pending: 0, verified: 0, rejected: 0, none: 0 },
    verifiedAmount: 0,
  };
  try {
    const paymentAgg = await Business.aggregate([
      { $match: { paymentStatus: { $in: ['pending', 'verified', 'rejected', 'none'] } } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          verifiedAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'verified'] },
                { $ifNull: ['$paymentAmount', 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    let verifiedSum = 0;
    const byStatus = { pending: 0, verified: 0, rejected: 0, none: 0 };
    paymentAgg.forEach((item) => {
      if (item._id && Object.prototype.hasOwnProperty.call(byStatus, item._id)) {
        byStatus[item._id] = item.count;
      }
      if (item._id === 'verified') {
        verifiedSum += item.verifiedAmount || 0;
      }
    });

    const receiptsCount = await Business.countDocuments({
      'paymentReceipt.url': { $exists: true, $ne: '' },
    }).catch(() => 0);

    payments = {
      totalReceipts: receiptsCount,
      byStatus,
      verifiedAmount: verifiedSum,
    };
  } catch (err) {
    console.error('Failed to aggregate payments for reports:', err.message);
  }

  // 8. Pending Aging (oldest pending date + count waiting > 7 days)
  let pendingAging = {
    oldestPendingDate: null,
    oldestPendingTitle: null,
    waitingOver7Days: 0,
  };
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [oldestPending, countOver7Days] = await Promise.all([
      Business.findOne({ isApproved: false })
        .sort({ createdAt: 1 })
        .select('createdAt title')
        .lean()
        .catch(() => null),
      Business.countDocuments({
        isApproved: false,
        createdAt: { $lte: sevenDaysAgo },
      }).catch(() => 0),
    ]);

    pendingAging = {
      oldestPendingDate: oldestPending?.createdAt || null,
      oldestPendingTitle: oldestPending?.title || null,
      waitingOver7Days: countOver7Days || 0,
    };
  } catch (err) {
    console.error('Failed to aggregate pending aging for reports:', err.message);
  }

  // 9. Reviews Total + overall average rating
  let reviews = {
    total: 0,
    avgRating: 0,
  };
  try {
    const reviewAgg = await Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    if (reviewAgg && reviewAgg.length > 0) {
      reviews = {
        total: reviewAgg[0].total || 0,
        avgRating: reviewAgg[0].avgRating ? parseFloat(reviewAgg[0].avgRating.toFixed(2)) : 0,
      };
    }
  } catch (err) {
    console.error('Failed to aggregate reviews for reports:', err.message);
  }

  res.status(200).json({
    success: true,
    data: {
      totals,
      byCategory,
      byCountry,
      topCities,
      businessesByMonth,
      usersByMonth,
      payments,
      pendingAging,
      reviews,
    },
  });
});

module.exports = {
  getDashboard,
  getUsers,
  getAllBusinesses,
  getPendingBusinesses,
  getAdminBusinessById,
  approveBusiness,
  rejectBusiness,
  adminDeleteBusiness,
  updateUserRole,
  updateUserPermissions,
  deleteUser,
  getAllReviews,
  adminDeleteReview,
  adminUpdateBusiness,
  getPaymentHistory,
  deleteBusinessReceipt,
  updateBusinessPaymentStatus,
  getClaimRequests,
  approveClaimRequest,
  rejectClaimRequest,
  spamUser,
  unspamUser,
  getEmailStats,
  getEmailLog,
  sendAdminEmail,
  getActivityLog,
  exportBackup,
  getQuota,
  getReports,
};



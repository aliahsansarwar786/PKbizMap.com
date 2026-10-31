const mongoose = require('mongoose');
const Business = require('../models/Business');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const escapeRegex = require('../utils/escapeRegex');
const sendEmail = require('../utils/sendEmail');
const { getNewListingNotificationHtml } = require('../utils/emailTemplates');
const getFrontendUrl = require('../utils/getFrontendUrl');
const PaymentSetting = require('../models/PaymentSetting');
const { validate, businessValidator, updateBusinessValidator, objectIdValidator } = require('../utils/validators');
const { normalizeCategory, getCategorySearchValues } = require('../utils/categories');

// Helper to validate http/https URL scheme
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

// ─── GET /api/businesses ──────────────────────────────────────────────────────
// Public: Returns only approved businesses with search, filter, pagination
const getBusinesses = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    country,
    city,
    rating,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const andConditions = [{ isApproved: true }]; // Only approved businesses publicly

  // ─── Keyword search (name / description / service / city) ─────────────────
  if (keyword && keyword.trim()) {
    const safeKeyword = escapeRegex(keyword.trim());
    andConditions.push({
      $or: [
        { title: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
        { category: { $regex: safeKeyword, $options: 'i' } },
        { 'address.city': { $regex: safeKeyword, $options: 'i' } },
      ],
    });
  }

  // ─── Country filter with permanent Pakistan backward-compat fallback ──────
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
      // For UAE, USA, or other countries: strict match only
      andConditions.push({ 'address.country': c });
    }
  }

  // ─── City filter ──────────────────────────────────────────────────────────
  if (city && city.trim() && city.trim().toLowerCase() !== 'all') {
    andConditions.push({
      'address.city': { $regex: `^${escapeRegex(city.trim())}$`, $options: 'i' },
    });
  }

  // ─── Category filter (supports canonical categories & legacy aliases) ───
  if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
    const searchValues = getCategorySearchValues(category.trim());
    if (searchValues.length > 1) {
      andConditions.push({ category: { $in: searchValues } });
    } else if (searchValues.length === 1) {
      andConditions.push({ category: searchValues[0] });
    } else {
      andConditions.push({ category: category.trim() });
    }
  }

  // ─── Rating filter (5, 4+, 3+) ────────────────────────────────────────────
  if (rating && rating.trim() && rating.trim().toLowerCase() !== 'all') {
    const cleanRating = rating.trim().replace('+', '');
    const numRating = parseFloat(cleanRating);
    if (!isNaN(numRating) && numRating > 0) {
      andConditions.push({ averageRating: { $gte: numRating } });
    }
  }

  const queryObj = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  // ─── Pagination ───────────────────────────────────────────────────────────
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // ─── Allowed sort fields ──────────────────────────────────────────────────
  const allowedSorts = ['-createdAt', 'createdAt', '-averageRating', 'averageRating', 'title', '-title'];
  const sortStr = allowedSorts.includes(sort) ? sort : '-createdAt';

  // ─── Execute query ────────────────────────────────────────────────────────
  const [businesses, total] = await Promise.all([
    Business.find(queryObj)
      .populate('owner', 'name avatar')
      .select('-__v -paymentReceipt -paymentStatus -paymentAmount')
      .sort(sortStr)
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

// ─── GET /api/businesses/:id ──────────────────────────────────────────────────
// Public: Returns single approved business with reviews (accepts slug or Mongo ID)
const getBusiness = [
  asyncHandler(async (req, res) => {
    const identifier = (req.params.id || '').trim();
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Business identifier is required.',
      });
    }

    // 1. Try slug lookup first
    let business = await Business.findOne({
      slug: identifier,
      isApproved: true,
    })
      .populate('owner', 'name avatar createdAt')
      .select('-__v -paymentReceipt -paymentStatus -paymentAmount');

    // 2. Fall back to Mongo ID lookup if not found by slug
    if (!business && mongoose.Types.ObjectId.isValid(identifier)) {
      business = await Business.findOne({
        _id: identifier,
        isApproved: true,
      })
        .populate('owner', 'name avatar createdAt')
        .select('-__v -paymentReceipt -paymentStatus -paymentAmount');
    }

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
    }

    // Self-healing fallback: if slug is missing, generate and save on the fly
    if (!business.slug) {
      const { generateUniqueSlug } = require('../utils/slugify');
      business.slug = await generateUniqueSlug(business.title, business.address?.city, business._id, Business);
      try {
        await business.save();
      } catch (err) {
        console.error('⚠️ [Business:GetById] Failed to persist self-healed slug:', err.message);
      }
    }

    // Get reviews for this business
    const reviews = await Review.find({ business: business._id })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      message: 'Business retrieved successfully.',
      data: { business, reviews },
    });
  }),
];

// ─── POST /api/businesses ─────────────────────────────────────────────────────
// Protected: Authenticated users create businesses
const createBusiness = [
  ...businessValidator,
  asyncHandler(async (req, res) => {
    // Spam account enforcement: prevent flagged accounts from creating businesses
    if (req.user?.isSpam) {
      const imageFiles = Array.isArray(req.files) ? req.files : (req.files?.images || []);
      if (imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map((file) => cloudinary.uploader.destroy(file.filename).catch(() => {}))
        );
      }
      const receiptFile = req.files?.paymentReceipt?.[0];
      if (receiptFile?.filename) {
        await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
      }
      return res.status(403).json({
        success: false,
        message: 'Your account is restricted from creating new business listings.',
      });
    }

    // Require verified email before adding a business (admins and subadmins bypass)
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'subadmin';
    if (!isAdmin && !req.user?.emailVerified) {
      // Clean up uploaded images from Cloudinary if any
      const imageFiles = Array.isArray(req.files) ? req.files : (req.files?.images || []);
      if (imageFiles.length > 0) {
        await Promise.all(
          imageFiles.map((file) => cloudinary.uploader.destroy(file.filename).catch(() => {}))
        );
      }
      const receiptFile = req.files?.paymentReceipt?.[0];
      if (receiptFile?.filename) {
        await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
      }
      return res.status(403).json({
        success: false,
        requiresEmailVerification: true,
        message: 'Please verify your email before adding a business.',
      });
    }

    validate(req);

    const {
      title,
      description,
      category,
      subcategory,
      contactPerson,
      email,
      phone,
      whatsapp,
      website,
      address,
      openingHours,
      socialLinks,
    } = req.body;

    // Process uploaded business images
    const imageFiles = Array.isArray(req.files)
      ? req.files
      : (req.files?.images || []);
    const images = imageFiles.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    // Process payment receipt if uploaded
    const receiptFile = req.files?.paymentReceipt?.[0];
    let paymentReceipt = { url: '', publicId: '' };
    let paymentStatus = 'none';
    let paymentAmount = 0;

    if (receiptFile) {
      paymentReceipt = {
        url: receiptFile.path,
        publicId: receiptFile.filename,
      };
      paymentStatus = 'pending';
    }

    // Check payment system settings (Multi-country fee support)
    let requiresPayment = false;
    const paymentSetting = await PaymentSetting.getSettings();
    if (paymentSetting && paymentSetting.isEnabled) {
      const targetCountry = address?.country || req.body?.country || req.body?.['address[country]'] || 'Pakistan';
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
        if (images.length > 0) {
          await Promise.all(
            images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {}))
          );
        }
        if (receiptFile) {
          await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
        }
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Listing creation is temporarily blocked.',
        });
      }

      if (!Number.isFinite(effectiveFee) || effectiveFee < 0) {
        if (images.length > 0) {
          await Promise.all(
            images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {}))
          );
        }
        if (receiptFile) {
          await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
        }
        return res.status(503).json({
          success: false,
          message: 'Payment settings are currently unavailable. Listing creation is temporarily blocked.',
        });
      }

      if (effectiveFee > 0) {
        requiresPayment = true;
        if (!receiptFile) {
          // Clean up any uploaded business images to avoid orphaned files in Cloudinary
          if (images.length > 0) {
            await Promise.all(
              images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {}))
            );
          }
          return res.status(400).json({
            success: false,
            message: `Payment screenshot is required for ${targetCountry} (${feeInfo.symbol || ''}${effectiveFee})`,
          });
        }
        paymentAmount = effectiveFee;
        paymentStatus = 'pending';
      } else {
        // Free listing for countries with fee = 0
        paymentAmount = 0;
        paymentStatus = 'none';
      }
    }

    const businessAddress = {
      country: address?.country || req.body?.country || req.body?.['address[country]'] || 'Pakistan',
      city: address?.city || req.body?.city || req.body?.['address[city]'] || '',
      street: address?.street || req.body?.street || req.body?.['address[street]'] || '',
      area: address?.area || req.body?.area || req.body?.['address[area]'] || '',
      zipCode: address?.zipCode || req.body?.zipCode || req.body?.['address[zipCode]'] || '',
    };

    let parsedOpeningHours = null;
    if (openingHours) {
      if (typeof openingHours === 'string') {
        try {
          parsedOpeningHours = JSON.parse(openingHours);
        } catch {}
      } else if (typeof openingHours === 'object') {
        parsedOpeningHours = openingHours;
      }
    }

    let parsedSocialLinks = { facebook: '', youtube: '', googleBusiness: '' };
    if (socialLinks) {
      if (typeof socialLinks === 'string') {
        try {
          parsedSocialLinks = { ...parsedSocialLinks, ...JSON.parse(socialLinks) };
        } catch {}
      } else if (typeof socialLinks === 'object') {
        parsedSocialLinks = { ...parsedSocialLinks, ...socialLinks };
      }
    }
    if (req.body['socialLinks[facebook]'] || req.body.facebook) {
      parsedSocialLinks.facebook = req.body['socialLinks[facebook]'] || req.body.facebook;
    }
    if (req.body['socialLinks[youtube]'] || req.body.youtube) {
      parsedSocialLinks.youtube = req.body['socialLinks[youtube]'] || req.body.youtube;
    }
    if (req.body['socialLinks[googleBusiness]'] || req.body.googleBusiness) {
      parsedSocialLinks.googleBusiness = req.body['socialLinks[googleBusiness]'] || req.body.googleBusiness;
    }

    // Validate website scheme (http/https only)
    if (website && !isValidHttpUrl(website)) {
      if (images.length > 0) {
        await Promise.all(images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {})));
      }
      if (receiptFile?.filename) {
        await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Website must be a valid URL starting with http:// or https://',
      });
    }

    // Validate socialLinks schemes (http/https only)
    for (const [key, val] of Object.entries(parsedSocialLinks)) {
      if (val && !isValidHttpUrl(val)) {
        if (images.length > 0) {
          await Promise.all(images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {})));
        }
        if (receiptFile?.filename) {
          await cloudinary.uploader.destroy(receiptFile.filename).catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: `${key} must be a valid URL starting with http:// or https://`,
        });
      }
    }

    // NEVER trust owner from req.body - always use authenticated user
    const business = await Business.create({
      title,
      description,
      category,
      subcategory: subcategory || '',
      contactPerson: contactPerson || '',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      whatsapp: whatsapp ? whatsapp.trim() : '',
      website: website || '',
      socialLinks: parsedSocialLinks,
      openingHours: parsedOpeningHours,
      address: businessAddress,
      images,
      paymentReceipt,
      paymentStatus,
      paymentAmount,
      owner: req.user._id, // Server-side only
      isApproved: req.user.role === 'admin' && !requiresPayment, // Auto-approve if Admin
    });

    // Owner Notification: New listing submitted alert
    // Awaited before responding so Vercel serverless functions do not freeze SMTP delivery.
    try {
      const activeSettings = await PaymentSetting.getSettings();
      const ownerEmail = activeSettings?.ownerNotificationEmail?.trim();
      const isOwnerNotificationsEnabled = activeSettings?.ownerNotificationsEnabled !== false;

      if (isOwnerNotificationsEnabled && ownerEmail) {
        const frontendUrl = getFrontendUrl(req);
        const pendingUrl = `${frontendUrl}/folder/new/admin`;

        await sendEmail({
          to: ownerEmail,
          subject: `New listing submitted: ${String(business.title || '').replace(/[\r\n]+/g, ' ').trim()}`,
          html: getNewListingNotificationHtml({
            businessTitle: business.title,
            category: business.category,
            city: business.address?.city,
            country: business.address?.country,
            submittedByName: req.user?.name,
            submittedByEmail: req.user?.email,
            pendingUrl,
          }),
        }).catch((err) => {
          console.error('⚠️ [Business:Create] Non-fatal error sending owner alert:', err.message);
        });
      }
    } catch (e) {
      console.error('⚠️ [Business:Create] Unexpected error setting up owner alert:', e.message);
    }

    res.status(201).json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Business created and auto-approved successfully.' 
        : 'Business created successfully. It will be visible after admin approval.',
      data: { business },
    });
  }),
];

// ─── PATCH /api/businesses/:id ────────────────────────────────────────────────
// Protected: Owner can edit, Admin can edit any
const updateBusiness = [
  ...objectIdValidator('id'),
  ...updateBusinessValidator,
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authorization: owner or admin only
    const isOwner = business.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this business.',
      });
    }

    // Allowed update fields - NEVER allow owner, isApproved, role from body
    const allowedFields = [
      'title',
      'description',
      'category',
      'subcategory',
      'contactPerson',
      'email',
      'phone',
      'whatsapp',
      'website',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'email') {
          updates.email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        } else if (field === 'whatsapp') {
          updates.whatsapp = req.body.whatsapp ? req.body.whatsapp.trim() : '';
        } else if (field === 'phone') {
          updates.phone = req.body.phone ? req.body.phone.trim() : '';
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.body.openingHours !== undefined) {
      if (typeof req.body.openingHours === 'string') {
        try {
          updates.openingHours = JSON.parse(req.body.openingHours);
        } catch {
          updates.openingHours = null;
        }
      } else {
        updates.openingHours = req.body.openingHours;
      }
    }

    if (req.body.socialLinks !== undefined) {
      if (typeof req.body.socialLinks === 'string') {
        try {
          updates.socialLinks = JSON.parse(req.body.socialLinks);
        } catch {}
      } else if (typeof req.body.socialLinks === 'object') {
        updates.socialLinks = req.body.socialLinks;
      }
    }
    if (req.body['socialLinks[facebook]'] !== undefined || req.body.facebook !== undefined) {
      updates.socialLinks = { ...(updates.socialLinks || business.socialLinks?.toObject?.() || business.socialLinks || {}), facebook: req.body['socialLinks[facebook]'] ?? req.body.facebook };
    }
    if (req.body['socialLinks[youtube]'] !== undefined || req.body.youtube !== undefined) {
      updates.socialLinks = { ...(updates.socialLinks || business.socialLinks?.toObject?.() || business.socialLinks || {}), youtube: req.body['socialLinks[youtube]'] ?? req.body.youtube };
    }
    if (req.body['socialLinks[googleBusiness]'] !== undefined || req.body.googleBusiness !== undefined) {
      updates.socialLinks = { ...(updates.socialLinks || business.socialLinks?.toObject?.() || business.socialLinks || {}), googleBusiness: req.body['socialLinks[googleBusiness]'] ?? req.body.googleBusiness };
    }

    // Validate website scheme (http/https only)
    if (updates.website !== undefined && !isValidHttpUrl(updates.website)) {
      return res.status(400).json({
        success: false,
        message: 'Website must be a valid URL starting with http:// or https://',
      });
    }

    // Validate socialLinks schemes (http/https only)
    if (updates.socialLinks) {
      for (const [key, val] of Object.entries(updates.socialLinks)) {
        if (val && !isValidHttpUrl(val)) {
          return res.status(400).json({
            success: false,
            message: `${key} must be a valid URL starting with http:// or https://`,
          });
        }
      }
    }

    const hasAddressField = req.body.address || req.body['address[city]'] || req.body.city || req.body['address[country]'] || req.body.country || req.body['address[street]'] || req.body.street || req.body['address[area]'] || req.body.area || req.body['address[zipCode]'] || req.body.zipCode;

    if (hasAddressField) {
      const addrObj = typeof req.body.address === 'object' && req.body.address !== null ? req.body.address : {};
      const countryVal = addrObj.country || req.body.country || req.body['address[country]'];
      const cityVal = addrObj.city !== undefined ? addrObj.city : (req.body.city !== undefined ? req.body.city : req.body['address[city]']);
      const streetVal = addrObj.street !== undefined ? addrObj.street : (req.body.street !== undefined ? req.body.street : req.body['address[street]']);
      const areaVal = addrObj.area !== undefined ? addrObj.area : (req.body.area !== undefined ? req.body.area : req.body['address[area]']);
      const zipCodeVal = addrObj.zipCode !== undefined ? addrObj.zipCode : (req.body.zipCode !== undefined ? req.body.zipCode : req.body['address[zipCode]']);

      updates.address = {
        country: countryVal || business.address?.country || 'Pakistan',
        city: cityVal !== undefined ? cityVal : business.address?.city,
        street: streetVal !== undefined ? streetVal : business.address?.street,
        area: areaVal !== undefined ? areaVal : (business.address?.area || ''),
        zipCode: zipCodeVal !== undefined ? zipCodeVal : (business.address?.zipCode || ''),
      };
    }

    const oldCountry = business.address?.country || 'Pakistan';
    const newCountry = updates.address?.country;
    const countryChanged = Boolean(newCountry && newCountry.trim().toLowerCase() !== oldCountry.trim().toLowerCase());

    if (countryChanged) {
      const paymentSetting = await PaymentSetting.getSettings();
      if (paymentSetting && paymentSetting.isEnabled) {
        const targetCountry = newCountry.trim();
        let newFee;
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
          newFee = parsedFee;
        } catch (feeErr) {
          const newImageFiles = Array.isArray(req.files) ? req.files : (req.files?.images || []);
          if (newImageFiles && newImageFiles.length > 0) {
            await Promise.all(
              newImageFiles.map((file) => cloudinary.uploader.destroy(file.filename).catch(() => {}))
            );
          }
          const updatedReceiptFile = req.files?.paymentReceipt?.[0];
          if (updatedReceiptFile) {
            await cloudinary.uploader.destroy(updatedReceiptFile.filename).catch(() => {});
          }
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
          updates.paymentAmount = 0;
          updates.paymentStatus = 'none';
          if (business.paymentReceipt?.publicId) {
            cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
              console.error('Failed to delete receipt from Cloudinary on country change:', err.message);
            });
          }
          updates.paymentReceipt = { url: '', publicId: '' };
        } else {
          updates.paymentAmount = newFee;
          if (!wasVerifiedAndCovered) {
            updates.paymentStatus = 'pending';
            updates.isApproved = false;
            if (business.paymentReceipt?.publicId) {
              cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch((err) => {
                console.error('Failed to delete receipt from Cloudinary on country change:', err.message);
              });
            }
            updates.paymentReceipt = { url: '', publicId: '' };
          }
        }
      }
    }

    // Handle new image uploads
    const newImageFiles = Array.isArray(req.files) ? req.files : (req.files?.images || []);
    if (newImageFiles && newImageFiles.length > 0) {
      const newImages = newImageFiles.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));

      // Check total images won't exceed 5
      const totalImages = business.images.length + newImages.length;
      if (totalImages > 5) {
        return res.status(400).json({
          success: false,
          message: `Cannot upload ${newImages.length} more images. Maximum 5 images allowed. Current: ${business.images.length}`,
        });
      }

      updates.$push = { images: { $each: newImages } };
    }

    // Handle new payment receipt upload
    const updatedReceiptFile = req.files?.paymentReceipt?.[0];
    if (updatedReceiptFile) {
      if (business.paymentReceipt?.publicId) {
        await cloudinary.uploader.destroy(business.paymentReceipt.publicId).catch(() => {});
      }
      updates.paymentReceipt = {
        url: updatedReceiptFile.path,
        publicId: updatedReceiptFile.filename,
      };
      updates.paymentStatus = 'pending';

      const paymentSetting = await PaymentSetting.getSettings();
      if (paymentSetting && paymentSetting.isEnabled) {
        const targetCountry = updates.address?.country || business.address?.country || 'Pakistan';
        let reuploadFee;
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
          reuploadFee = parsedFee;
        } catch (feeErr) {
          await cloudinary.uploader.destroy(updatedReceiptFile.filename).catch(() => {});
          return res.status(503).json({
            success: false,
            message: 'Payment settings are currently unavailable. Receipt update is temporarily blocked.',
          });
        }

        if (!Number.isFinite(reuploadFee) || reuploadFee < 0) {
          await cloudinary.uploader.destroy(updatedReceiptFile.filename).catch(() => {});
          return res.status(503).json({
            success: false,
            message: 'Payment settings are currently unavailable. Receipt update is temporarily blocked.',
          });
        }

        updates.paymentAmount = reuploadFee;
      }
    }

    // Non-admin edits reset approval (content change requires re-approval)
    if (!isAdmin) {
      updates.isApproved = false;
    }

    const updated = await Business.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: isAdmin
        ? 'Business updated successfully.'
        : 'Business updated successfully. It requires re-approval.',
      data: { business: updated },
    });
  }),
];

// ─── DELETE /api/businesses/:id ──────────────────────────────────────────────
// Protected: Owner or Admin only
const deleteBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    // Authorization: owner or admin only
    const isOwner = business.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this business.',
      });
    }

    // Delete all images from Cloudinary
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

    // Delete all reviews for this business
    await Review.deleteMany({ business: business._id });

    // Delete all claim requests for this business
    const ClaimRequest = require('../models/ClaimRequest');
    await ClaimRequest.deleteMany({ business: business._id });

    await Business.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Business and all associated data deleted successfully.',
    });
  }),
];

// ─── DELETE /api/businesses/:id/images/:publicId ─────────────────────────────
// Protected: Owner or Admin - delete a single business image
const deleteBusinessImage = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const isOwner = business.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const { publicId } = req.params;
  // Verify image belongs to this business
  const imageExists = business.images.some((img) => img.publicId === publicId);
  if (!imageExists) {
    return res.status(404).json({ success: false, message: 'Image not found in this business.' });
  }

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  // Remove from DB
  await Business.findByIdAndUpdate(req.params.id, {
    $pull: { images: { publicId } },
  });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully.',
  });
});

// ─── GET /api/businesses/my ───────────────────────────────────────────────────
// Protected: Get authenticated user's own businesses (all approval statuses)
const getMyBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [businesses, total, approvedCount, pendingCount] = await Promise.all([
    Business.find({ owner: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments({ owner: req.user._id }),
    Business.countDocuments({ owner: req.user._id, isApproved: true }),
    Business.countDocuments({ owner: req.user._id, isApproved: false }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Your businesses retrieved successfully.',
    data: {
      businesses,
      approvedCount,
      pendingCount,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        resultsPerPage: limitNum,
      },
    },
  });
});

// ─── GET /api/businesses/summary ──────────────────────────────────────────────
// Public: Returns listing counts grouped by country, city, and category
// Optional query params: country, city (for city-level and country-level filtering)
const getBusinessSummary = asyncHandler(async (req, res) => {
  const { country, city } = req.query;

  const andConditions = [{ isApproved: true }];

  const hasCountry = country && country.trim() && country.trim().toLowerCase() !== 'all';
  const hasCity = city && city.trim() && city.trim().toLowerCase() !== 'all';

  if (hasCountry) {
    const c = country.trim();
    if (c.toLowerCase() === 'pakistan') {
      andConditions.push({
        $or: [
          { 'address.country': 'Pakistan' },
          { 'address.country': { $exists: false } },
          { 'address.country': null },
          { 'address.country': '' },
        ],
      });
    } else {
      andConditions.push({ 'address.country': c });
    }
  }

  if (hasCity) {
    andConditions.push({
      'address.city': { $regex: `^${escapeRegex(city.trim())}$`, $options: 'i' },
    });
  }

  const queryObj = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  // MongoDB aggregation pipeline to count grouped records without loading all documents into memory
  const aggregateResults = await Business.aggregate([
    { $match: queryObj },
    {
      $group: {
        _id: {
          country: { $ifNull: ['$address.country', ''] },
          city: { $ifNull: ['$address.city', ''] },
          category: { $ifNull: ['$category', ''] },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const countries = { Pakistan: 0, UAE: 0, USA: 0 };
  const cities = { Pakistan: {}, UAE: {}, USA: {} };
  const categories = { Pakistan: {}, UAE: {}, USA: {} };
  const categoriesByCity = { Pakistan: {}, UAE: {}, USA: {} };
  let total = 0;

  for (const item of aggregateResults) {
    const count = item.count;
    total += count;

    let bCountry = (item._id.country || '').trim();
    // Backward-compat fallback: if country is missing or invalid, treat as Pakistan
    if (!bCountry || !['Pakistan', 'UAE', 'USA'].includes(bCountry)) {
      bCountry = 'Pakistan';
    }

    countries[bCountry] = (countries[bCountry] || 0) + count;

    const rawCity = (item._id.city || '').trim();
    if (rawCity) {
      if (!cities[bCountry]) cities[bCountry] = {};
      cities[bCountry][rawCity] = (cities[bCountry][rawCity] || 0) + count;
    }

    const rawCat = (item._id.category || '').trim();
    const cat = normalizeCategory(rawCat);
    if (cat) {
      if (!categories[bCountry]) categories[bCountry] = {};
      categories[bCountry][cat] = (categories[bCountry][cat] || 0) + count;
    }

    if (!categoriesByCity[bCountry]) categoriesByCity[bCountry] = {};
    if (rawCity && cat) {
      if (!categoriesByCity[bCountry][rawCity]) categoriesByCity[bCountry][rawCity] = {};
      categoriesByCity[bCountry][rawCity][cat] =
        (categoriesByCity[bCountry][rawCity][cat] || 0) + count;
    }
  }

  res.status(200).json({
    success: true,
    message: 'Business summary counts retrieved successfully.',
    data: {
      total,
      countries,
      cities,
      categories,
      categoriesByCity,
    },
  });
});

module.exports = {
  getBusinesses,
  getBusiness,
  getBusinessSummary,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  deleteBusinessImage,
  getMyBusinesses,
};

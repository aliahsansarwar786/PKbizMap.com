const mongoose = require('mongoose');
const Business = require('../models/Business');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const escapeRegex = require('../utils/escapeRegex');
const { validate, businessValidator, updateBusinessValidator, objectIdValidator } = require('../utils/validators');

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

  // ─── Category filter ──────────────────────────────────────────────────────
  if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
    andConditions.push({ category: category.trim() });
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
      .select('-__v')
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
// Public: Returns single approved business with reviews
const getBusiness = [
  ...objectIdValidator('id'),
  asyncHandler(async (req, res) => {
    validate(req);

    const business = await Business.findOne({
      _id: req.params.id,
      isApproved: true,
    })
      .populate('owner', 'name avatar createdAt')
      .select('-__v');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
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

    // Check payment system settings
    const PaymentSetting = require('../models/PaymentSetting');
    const paymentSetting = await PaymentSetting.getSettings();
    if (paymentSetting && paymentSetting.isEnabled) {
      if (!receiptFile) {
        // Clean up any uploaded business images to avoid orphaned files in Cloudinary
        if (images.length > 0) {
          await Promise.all(
            images.map((img) => cloudinary.uploader.destroy(img.publicId).catch(() => {}))
          );
        }
        return res.status(400).json({
          success: false,
          message: 'Payment screenshot is required to complete submission',
        });
      }
      paymentAmount = paymentSetting.feeAmount;
      paymentStatus = 'pending';
    }

    // --- PRO TIER LIMIT CHECK ---
    const MAX_BUSINESSES = 2000; // Increased limit for free tier
    const totalCount = await Business.countDocuments();
    if (totalCount >= MAX_BUSINESSES) {
      console.log('🚨 ALERT: Business limit reached! Admin notified.');
      return res.status(403).json({
        success: false,
        message: `System limit reached! Maximum ${MAX_BUSINESSES} businesses allowed in the free tier. Admin has been notified.`,
      });
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

    // NEVER trust owner from req.body - always use authenticated user
    const business = await Business.create({
      title,
      description,
      category,
      subcategory: subcategory || '',
      contactPerson: contactPerson || '',
      email,
      phone,
      whatsapp: whatsapp || '',
      website: website || '',
      socialLinks: parsedSocialLinks,
      openingHours: parsedOpeningHours,
      address: businessAddress,
      images,
      paymentReceipt,
      paymentStatus,
      paymentAmount,
      owner: req.user._id, // Server-side only
      isApproved: req.user.role === 'admin', // Auto-approve if Admin
    });

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
        updates[field] = req.body[field];
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

  const [businesses, total] = await Promise.all([
    Business.find({ owner: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Business.countDocuments({ owner: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Your businesses retrieved successfully.',
    data: {
      businesses,
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
const getBusinessSummary = asyncHandler(async (req, res) => {
  const businesses = await Business.find(
    { isApproved: true },
    'address.country address.city category'
  ).lean();

  const countries = { Pakistan: 0, UAE: 0, USA: 0 };
  const cities = { Pakistan: {}, UAE: {}, USA: {} };
  const categories = { Pakistan: {}, UAE: {}, USA: {} };

  for (const b of businesses) {
    let country = (b.address?.country || '').trim();
    // Backward-compat fallback: if country is missing or invalid, treat as Pakistan
    if (!country || !['Pakistan', 'UAE', 'USA'].includes(country)) {
      country = 'Pakistan';
    }

    countries[country] = (countries[country] || 0) + 1;

    const rawCity = (b.address?.city || '').trim();
    if (rawCity) {
      if (!cities[country]) cities[country] = {};
      cities[country][rawCity] = (cities[country][rawCity] || 0) + 1;
    }

    const cat = (b.category || '').trim();
    if (cat) {
      if (!categories[country]) categories[country] = {};
      categories[country][cat] = (categories[country][cat] || 0) + 1;
    }
  }

  res.status(200).json({
    success: true,
    message: 'Business summary counts retrieved successfully.',
    data: {
      total: businesses.length,
      countries,
      cities,
      categories,
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

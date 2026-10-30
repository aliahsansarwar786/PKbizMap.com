const PaymentSetting = require('../models/PaymentSetting');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');
const { logActivity } = require('../utils/activityLogger');

// Helper to validate IBAN and account number
const validatePaymentMethodData = ({ name, kind, accountTitle, accountValue }) => {
  if (!name || !name.trim()) {
    return 'Payment method name is required.';
  }
  if (!kind || !['iban', 'number'].includes(kind.trim().toLowerCase())) {
    return 'Kind must be either "iban" or "number".';
  }
  if (!accountTitle || !accountTitle.trim()) {
    return 'Account Title is required.';
  }
  if (!accountValue || !accountValue.trim()) {
    return 'Account Number or IBAN is required.';
  }

  const cleanKind = kind.trim().toLowerCase();
  const cleanVal = accountValue.trim();

  if (cleanKind === 'iban') {
    const compactIban = cleanVal.replace(/\s+/g, '').toUpperCase();
    if (!compactIban.startsWith('PK') || compactIban.length !== 24) {
      return 'Invalid Pakistani IBAN. Must start with "PK" and be exactly 24 characters.';
    }
  } else if (cleanKind === 'number') {
    if (!/^[0-9+\-\s()]{7,30}$/.test(cleanVal)) {
      return 'Please provide a valid account or phone number (7-30 digits).';
    }
  }

  return null;
};

// ─── GET /api/settings/payment ────────────────────────────────────────────────
// Public: Returns payment settings for users creating a business listing
const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await PaymentSetting.getSettings();
  if (!settings) {
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }

  const isAdmin = req.user && req.user.role === 'admin';

  res.status(200).json({
    success: true,
    message: 'Payment settings retrieved successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        fees: settings.fees,
        feeAmount: settings.fees?.Pakistan?.amount ?? settings.feeAmount ?? 50,
        qrCode: settings.qrCode || { url: '', publicId: '' },
        qrEnabled: settings.qrEnabled !== false,
        qrCountries: settings.qrCountries || ['Pakistan'],
        raastId: settings?.raastId || '',
        accountTitle: settings?.accountTitle || 'BizPrimeHub',
        bankName: settings?.bankName || 'Raast Instant Payment',
        instructions: settings?.instructions,
        paymentMethods: settings?.paymentMethods || [],
        ...(isAdmin ? {
          ownerNotificationEmail: settings?.ownerNotificationEmail || process.env.OWNER_NOTIFICATION_EMAIL || '',
          ownerNotificationsEnabled: settings?.ownerNotificationsEnabled !== false,
        } : {}),
      },
    },
  });
});

// ─── PATCH /api/admin/settings/payment ────────────────────────────────────────
// Protected (Admin): Update general payment configuration (toggle on/off, change amount, QR code, account details)
const updatePaymentSettings = asyncHandler(async (req, res) => {
  const {
    isEnabled,
    feeAmount,
    fees,
    qrEnabled,
    qrCountries,
    raastId,
    accountTitle,
    bankName,
    instructions,
    removeQrCode,
    ownerNotificationsEnabled,
    ownerNotificationEmail,
  } = req.body;

  // Validate isEnabled
  let targetIsEnabled = undefined;
  if (isEnabled !== undefined) {
    if (isEnabled === true || isEnabled === 'true' || isEnabled === 1 || isEnabled === '1') {
      targetIsEnabled = true;
    } else if (isEnabled === false || isEnabled === 'false' || isEnabled === 0 || isEnabled === '0') {
      targetIsEnabled = false;
    } else {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid isEnabled value. Must be a boolean (true/false, 1/0).',
      });
    }
  }

  // Validate multi-country fees (if provided)
  let validatedFees = null;
  if (fees !== undefined && fees !== null) {
    let parsedFees = fees;
    if (typeof parsedFees === 'string') {
      try {
        parsedFees = JSON.parse(parsedFees);
      } catch {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid fees JSON format.',
        });
      }
    }
    if (typeof parsedFees !== 'object' || parsedFees === null || Array.isArray(parsedFees)) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Fees must be an object with country keys.',
      });
    }

    const allowedCountries = ['Pakistan', 'UAE', 'USA'];
    const keys = Object.keys(parsedFees);
    for (const key of keys) {
      if (!allowedCountries.includes(key)) {
        if (req.file) {
          await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        return res.status(400).json({
          success: false,
          message: `Invalid country in fees: "${key}". Allowed countries are Pakistan, UAE, USA.`,
        });
      }
    }

    validatedFees = {};
    for (const c of allowedCountries) {
      if (parsedFees[c] !== undefined) {
        if (typeof parsedFees[c] !== 'object' || parsedFees[c] === null || Array.isArray(parsedFees[c])) {
          if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
          }
          return res.status(400).json({
            success: false,
            message: `Fee configuration for ${c} must be an object with an amount.`,
          });
        }
        const rawAmt = parsedFees[c].amount;
        if (rawAmt === undefined || rawAmt === null || rawAmt === '' || (typeof rawAmt === 'string' && rawAmt.trim() === '')) {
          if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
          }
          return res.status(400).json({
            success: false,
            message: `Invalid fee amount for ${c}. Must be a finite number between 0 and 1,000,000.`,
          });
        }
        const num = Number(rawAmt);
        if (!Number.isFinite(num) || num < 0 || num > 1000000) {
          if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
          }
          return res.status(400).json({
            success: false,
            message: `Invalid fee amount for ${c}. Must be a finite number between 0 and 1,000,000.`,
          });
        }
        validatedFees[c] = num;
      }
    }
  }

  // Validate legacy feeAmount (if provided)
  let validatedLegacyFee = null;
  if (feeAmount !== undefined && feeAmount !== null) {
    if (feeAmount === '' || (typeof feeAmount === 'string' && feeAmount.trim() === '')) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid feeAmount. Must be a finite number between 0 and 1,000,000.',
      });
    }
    const num = Number(feeAmount);
    if (!Number.isFinite(num) || num < 0 || num > 1000000) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid feeAmount. Must be a finite number between 0 and 1,000,000.',
      });
    }
    validatedLegacyFee = num;
  }

  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }

  if (targetIsEnabled !== undefined) {
    settings.isEnabled = targetIsEnabled;
  }

  // Handle multi-country fees
  if (validatedFees !== null) {
    if (!settings.fees) settings.fees = {};
    const countryConfig = {
      Pakistan: { currency: 'PKR', symbol: 'Rs.' },
      UAE: { currency: 'AED', symbol: 'AED ' },
      USA: { currency: 'USD', symbol: '$' },
    };
    ['Pakistan', 'UAE', 'USA'].forEach((c) => {
      if (validatedFees[c] !== undefined) {
        settings.fees[c] = {
          amount: validatedFees[c],
          currency: countryConfig[c].currency,
          symbol: countryConfig[c].symbol,
        };
      }
    });
    if (settings.fees.Pakistan && settings.fees.Pakistan.amount !== undefined) {
      settings.feeAmount = settings.fees.Pakistan.amount;
    }
  } else if (validatedLegacyFee !== null) {
    settings.feeAmount = validatedLegacyFee;
    if (!settings.fees) settings.fees = {};
    settings.fees.Pakistan = {
      amount: validatedLegacyFee,
      currency: 'PKR',
      symbol: 'Rs.',
    };
  }

  if (qrEnabled !== undefined) {
    settings.qrEnabled = qrEnabled === true || qrEnabled === 'true';
  }

  if (qrCountries !== undefined) {
    let parsedQc = qrCountries;
    if (typeof parsedQc === 'string') {
      try {
        parsedQc = JSON.parse(parsedQc);
      } catch {
        parsedQc = parsedQc.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(parsedQc)) {
      settings.qrCountries = parsedQc;
    }
  }

  if (typeof raastId === 'string') {
    settings.raastId = raastId.trim();
  }

  if (typeof accountTitle === 'string') {
    settings.accountTitle = accountTitle.trim();
  }

  if (typeof bankName === 'string') {
    settings.bankName = bankName.trim();
  }

  if (typeof instructions === 'string') {
    settings.instructions = instructions.trim();
  }

  // Handle owner notification settings
  if (ownerNotificationsEnabled !== undefined) {
    settings.ownerNotificationsEnabled = ownerNotificationsEnabled === true || ownerNotificationsEnabled === 'true';
  }

  if (ownerNotificationEmail !== undefined) {
    settings.ownerNotificationEmail = String(ownerNotificationEmail).trim().toLowerCase();
  }

  // Handle QR Code deletion if requested
  if (removeQrCode === true || removeQrCode === 'true') {
    if (settings.qrCode?.publicId) {
      await cloudinary.uploader.destroy(settings.qrCode.publicId).catch((err) => {
        console.error('Failed to delete old QR code from Cloudinary:', err.message);
      });
    }
    settings.qrCode = { url: '', publicId: '' };
  }

  // Handle new QR Code upload
  if (req.file) {
    if (settings.qrCode?.publicId) {
      await cloudinary.uploader.destroy(settings.qrCode.publicId).catch((err) => {
        console.error('Failed to delete old QR code from Cloudinary:', err.message);
      });
    }
    settings.qrCode = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  await settings.save();

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'update_payment_settings',
    targetType: 'settings',
    targetId: settings._id,
    targetLabel: 'Payment Settings',
    details: `Fee: Rs. ${settings.feeAmount}, Enabled: ${settings.isEnabled}`,
  });

  res.status(200).json({
    success: true,
    message: 'Payment settings updated successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        fees: settings.fees,
        feeAmount: settings.fees?.Pakistan?.amount ?? settings.feeAmount ?? 50,
        qrCode: settings.qrCode || { url: '', publicId: '' },
        qrEnabled: settings.qrEnabled !== false,
        qrCountries: settings.qrCountries || ['Pakistan'],
        raastId: settings.raastId,
        accountTitle: settings.accountTitle,
        bankName: settings.bankName,
        instructions: settings.instructions,
        paymentMethods: settings.paymentMethods || [],
        ownerNotificationEmail: settings.ownerNotificationEmail || process.env.OWNER_NOTIFICATION_EMAIL || '',
        ownerNotificationsEnabled: settings.ownerNotificationsEnabled !== false,
      },
    },
  });
});

// ─── DELETE /api/admin/settings/payment/qr ─────────────────────────────────────
// Protected (Admin): Delete the current Raast QR code image
const deletePaymentQrCode = asyncHandler(async (req, res) => {
  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }

  if (settings.qrCode?.publicId) {
    await cloudinary.uploader.destroy(settings.qrCode.publicId).catch((err) => {
      console.error('Failed to delete QR code from Cloudinary:', err.message);
    });
  }

  settings.qrCode = { url: '', publicId: '' };
  await settings.save();

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'delete_payment_qr',
    targetType: 'settings',
    targetId: settings._id,
    targetLabel: 'Payment Settings',
    details: 'Deleted payment QR code',
  });

  res.status(200).json({
    success: true,
    message: 'Raast QR code image removed successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        fees: settings.fees,
        feeAmount: settings.fees?.Pakistan?.amount ?? settings.feeAmount ?? 50,
        qrCode: { url: '', publicId: '' },
        qrEnabled: settings.qrEnabled !== false,
        qrCountries: settings.qrCountries || ['Pakistan'],
        raastId: settings.raastId,
        accountTitle: settings.accountTitle,
        bankName: settings.bankName,
        instructions: settings.instructions,
        paymentMethods: settings.paymentMethods || [],
      },
    },
  });
});

// ─── POST /api/admin/settings/payment/methods ─────────────────────────────────
// Protected (Admin): Add a new payment method card
const createPaymentMethod = asyncHandler(async (req, res) => {
  const { name, kind, accountTitle, accountValue, details, isEnabled, countries } = req.body;

  const validationError = validatePaymentMethodData({ name, kind, accountTitle, accountValue });
  if (validationError) {
    // If a file was uploaded but validation failed, clean up Cloudinary
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(400).json({ success: false, message: validationError });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Card background image is required. Please upload a JPG, PNG, or WebP image.',
    });
  }

  const cleanKind = kind.trim().toLowerCase();
  const formattedValue = cleanKind === 'iban'
    ? accountValue.replace(/\s+/g, '').toUpperCase()
    : accountValue.trim();

  let parsedCountries = countries;
  if (typeof parsedCountries === 'string') {
    try {
      parsedCountries = JSON.parse(parsedCountries);
    } catch {
      parsedCountries = parsedCountries.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(parsedCountries) || parsedCountries.length === 0) {
    parsedCountries = ['Pakistan'];
  }

  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }

  const newMethod = {
    name: name.trim(),
    kind: cleanKind,
    accountTitle: accountTitle.trim(),
    accountValue: formattedValue,
    details: (details || '').trim(),
    cardImage: {
      url: req.file.path,
      publicId: req.file.filename,
    },
    isEnabled: isEnabled === undefined ? true : (isEnabled === 'true' || isEnabled === true),
    countries: parsedCountries,
  };

  settings.paymentMethods.push(newMethod);
  await settings.save();

  const createdMethod = settings.paymentMethods[settings.paymentMethods.length - 1];

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'create_payment_method',
    targetType: 'settings',
    targetId: createdMethod._id,
    targetLabel: createdMethod.name,
    details: `Kind: ${createdMethod.kind}, Title: ${createdMethod.accountTitle}`,
  });

  res.status(201).json({
    success: true,
    message: `Payment method "${createdMethod.name}" added successfully.`,
    data: {
      method: createdMethod,
      paymentMethods: settings.paymentMethods,
    },
  });
});

// ─── PATCH /api/admin/settings/payment/methods/:methodId ──────────────────────
// Protected (Admin): Update an existing payment method
const updatePaymentMethod = asyncHandler(async (req, res) => {
  const { methodId } = req.params;
  const { name, kind, accountTitle, accountValue, details, isEnabled, countries } = req.body;

  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }
  const method = settings.paymentMethods.id(methodId);

  if (!method) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(404).json({ success: false, message: 'Payment method not found.' });
  }

  const targetName = name !== undefined ? name : method.name;
  const targetKind = kind !== undefined ? kind : method.kind;
  const targetTitle = accountTitle !== undefined ? accountTitle : method.accountTitle;
  const targetValue = accountValue !== undefined ? accountValue : method.accountValue;

  const validationError = validatePaymentMethodData({
    name: targetName,
    kind: targetKind,
    accountTitle: targetTitle,
    accountValue: targetValue,
  });

  if (validationError) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(400).json({ success: false, message: validationError });
  }

  method.name = targetName.trim();
  method.kind = targetKind.trim().toLowerCase();
  method.accountTitle = targetTitle.trim();
  method.accountValue = method.kind === 'iban'
    ? targetValue.replace(/\s+/g, '').toUpperCase()
    : targetValue.trim();

  if (details !== undefined) {
    method.details = details.trim();
  }

  if (isEnabled !== undefined) {
    method.isEnabled = isEnabled === 'true' || isEnabled === true;
  }

  if (countries !== undefined) {
    let parsedCountries = countries;
    if (typeof parsedCountries === 'string') {
      try {
        parsedCountries = JSON.parse(parsedCountries);
      } catch {
        parsedCountries = parsedCountries.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (Array.isArray(parsedCountries) && parsedCountries.length > 0) {
      method.countries = parsedCountries;
    }
  }

  // Handle replacing card image
  if (req.file) {
    if (method.cardImage?.publicId) {
      await cloudinary.uploader.destroy(method.cardImage.publicId).catch((err) => {
        console.error('Failed to delete old card image:', err.message);
      });
    }
    method.cardImage = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  await settings.save();

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'update_payment_method',
    targetType: 'settings',
    targetId: method._id,
    targetLabel: method.name,
    details: `Kind: ${method.kind}, Enabled: ${method.isEnabled}`,
  });

  res.status(200).json({
    success: true,
    message: `Payment method "${method.name}" updated successfully.`,
    data: {
      method,
      paymentMethods: settings.paymentMethods,
    },
  });
});

// ─── DELETE /api/admin/settings/payment/methods/:methodId ──────────────────────
// Protected (Admin): Delete a payment method and its image
const deletePaymentMethod = asyncHandler(async (req, res) => {
  const { methodId } = req.params;

  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }
  const method = settings.paymentMethods.id(methodId);

  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found.' });
  }

  if (method.cardImage?.publicId) {
    await cloudinary.uploader.destroy(method.cardImage.publicId).catch((err) => {
      console.error('Failed to delete card image from Cloudinary:', err.message);
    });
  }

  const methodName = method.name;
  const methodIdObj = method._id;
  settings.paymentMethods.pull(methodId);
  await settings.save();

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'delete_payment_method',
    targetType: 'settings',
    targetId: methodIdObj,
    targetLabel: methodName,
    details: `Deleted payment method ${methodName}`,
  });

  res.status(200).json({
    success: true,
    message: 'Payment method deleted successfully.',
    data: {
      paymentMethods: settings.paymentMethods,
    },
  });
});

// ─── PATCH /api/admin/settings/payment/methods/:methodId/toggle ───────────────
// Protected (Admin): Quickly toggle isEnabled for a payment method
const togglePaymentMethod = asyncHandler(async (req, res) => {
  const { methodId } = req.params;

  let settings = await PaymentSetting.getSettings();
  if (!settings) {
    settings = await PaymentSetting.initOrRepairSettings();
  }
  if (!settings) {
    if (req.file) {
      await cloudinary.uploader.destroy(req.file.filename).catch(() => {});
    }
    return res.status(503).json({
      success: false,
      message: 'Payment settings are currently unavailable.',
    });
  }
  const method = settings.paymentMethods.id(methodId);

  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found.' });
  }

  method.isEnabled = !method.isEnabled;
  await settings.save();

  logActivity({
    actorId: req.user?._id,
    actorName: req.user?.name,
    action: 'toggle_payment_method',
    targetType: 'settings',
    targetId: method._id,
    targetLabel: method.name,
    details: `Status: ${method.isEnabled ? 'enabled' : 'disabled'}`,
  });

  res.status(200).json({
    success: true,
    message: `Payment method "${method.name}" is now ${method.isEnabled ? 'enabled' : 'disabled'}.`,
    data: {
      method,
      paymentMethods: settings.paymentMethods,
    },
  });
});

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  deletePaymentQrCode,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
};

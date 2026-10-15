const PaymentSetting = require('../models/PaymentSetting');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

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

  res.status(200).json({
    success: true,
    message: 'Payment settings retrieved successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        feeAmount: settings.feeAmount,
        qrCode: settings.qrCode || { url: '', publicId: '' },
        raastId: settings.raastId || '',
        accountTitle: settings.accountTitle || 'BizPrimeHub',
        bankName: settings.bankName || 'Raast Instant Payment',
        instructions: settings.instructions,
        paymentMethods: settings.paymentMethods || [],
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
    raastId,
    accountTitle,
    bankName,
    instructions,
    removeQrCode,
  } = req.body;

  const settings = await PaymentSetting.getSettings();

  if (isEnabled !== undefined) {
    settings.isEnabled = isEnabled === true || isEnabled === 'true';
  }

  if (feeAmount !== undefined && feeAmount !== null) {
    const parsedFee = Number(feeAmount);
    if (!isNaN(parsedFee) && parsedFee >= 0) {
      settings.feeAmount = parsedFee;
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

  res.status(200).json({
    success: true,
    message: 'Payment settings updated successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        feeAmount: settings.feeAmount,
        qrCode: settings.qrCode || { url: '', publicId: '' },
        raastId: settings.raastId,
        accountTitle: settings.accountTitle,
        bankName: settings.bankName,
        instructions: settings.instructions,
        paymentMethods: settings.paymentMethods || [],
      },
    },
  });
});

// ─── DELETE /api/admin/settings/payment/qr ─────────────────────────────────────
// Protected (Admin): Delete the current Raast QR code image
const deletePaymentQrCode = asyncHandler(async (req, res) => {
  const settings = await PaymentSetting.getSettings();

  if (settings.qrCode?.publicId) {
    await cloudinary.uploader.destroy(settings.qrCode.publicId).catch((err) => {
      console.error('Failed to delete QR code from Cloudinary:', err.message);
    });
  }

  settings.qrCode = { url: '', publicId: '' };
  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Raast QR code image removed successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        feeAmount: settings.feeAmount,
        qrCode: { url: '', publicId: '' },
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
  const { name, kind, accountTitle, accountValue, details, isEnabled } = req.body;

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

  const settings = await PaymentSetting.getSettings();

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
  };

  settings.paymentMethods.push(newMethod);
  await settings.save();

  const createdMethod = settings.paymentMethods[settings.paymentMethods.length - 1];

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
  const { name, kind, accountTitle, accountValue, details, isEnabled } = req.body;

  const settings = await PaymentSetting.getSettings();
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

  const settings = await PaymentSetting.getSettings();
  const method = settings.paymentMethods.id(methodId);

  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found.' });
  }

  if (method.cardImage?.publicId) {
    await cloudinary.uploader.destroy(method.cardImage.publicId).catch((err) => {
      console.error('Failed to delete card image from Cloudinary:', err.message);
    });
  }

  settings.paymentMethods.pull(methodId);
  await settings.save();

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

  const settings = await PaymentSetting.getSettings();
  const method = settings.paymentMethods.id(methodId);

  if (!method) {
    return res.status(404).json({ success: false, message: 'Payment method not found.' });
  }

  method.isEnabled = !method.isEnabled;
  await settings.save();

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

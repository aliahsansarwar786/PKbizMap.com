const PaymentSetting = require('../models/PaymentSetting');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../config/cloudinary');

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
        jazzCashNumber: settings.jazzCashNumber || '',
        jazzCashTitle: settings.jazzCashTitle || '',
      },
    },
  });
});

// ─── PATCH /api/admin/settings/payment ────────────────────────────────────────
// Protected (Admin): Update payment configuration (toggle on/off, change amount, QR code, account details)
const updatePaymentSettings = asyncHandler(async (req, res) => {
  const {
    isEnabled,
    feeAmount,
    raastId,
    accountTitle,
    bankName,
    instructions,
    jazzCashNumber,
    jazzCashTitle,
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

  if (typeof jazzCashNumber === 'string') {
    settings.jazzCashNumber = jazzCashNumber.trim();
  }

  if (typeof jazzCashTitle === 'string') {
    settings.jazzCashTitle = jazzCashTitle.trim();
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
    message: 'Raast payment settings updated successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        feeAmount: settings.feeAmount,
        qrCode: settings.qrCode || { url: '', publicId: '' },
        raastId: settings.raastId,
        accountTitle: settings.accountTitle,
        bankName: settings.bankName,
        instructions: settings.instructions,
        jazzCashNumber: settings.jazzCashNumber || '',
        jazzCashTitle: settings.jazzCashTitle || '',
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
        jazzCashNumber: settings.jazzCashNumber || '',
        jazzCashTitle: settings.jazzCashTitle || '',
      },
    },
  });
});

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  deletePaymentQrCode,
};

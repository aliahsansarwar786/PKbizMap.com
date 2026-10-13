const PaymentSetting = require('../models/PaymentSetting');
const asyncHandler = require('../utils/asyncHandler');

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
        bankName: settings.bankName || 'Mobilink Microfinance Bank (JazzCash)',
        ibanNumber: settings.ibanNumber || '',
        accountTitle: settings.accountTitle,
        jazzCashNumber: settings.jazzCashNumber || '',
        instructions: settings.instructions,
      },
    },
  });
});

// ─── PATCH /api/admin/settings/payment ────────────────────────────────────────
// Protected (Admin): Update payment configuration (toggle on/off, change amount, IBAN, account details)
const updatePaymentSettings = asyncHandler(async (req, res) => {
  const {
    isEnabled,
    feeAmount,
    bankName,
    ibanNumber,
    accountTitle,
    jazzCashNumber,
    instructions,
  } = req.body;

  const settings = await PaymentSetting.getSettings();

  if (typeof isEnabled === 'boolean') {
    settings.isEnabled = isEnabled;
  }

  if (feeAmount !== undefined && feeAmount !== null) {
    const parsedFee = Number(feeAmount);
    if (!isNaN(parsedFee) && parsedFee >= 0) {
      settings.feeAmount = parsedFee;
    }
  }

  if (typeof bankName === 'string') {
    settings.bankName = bankName.trim();
  }

  if (typeof ibanNumber === 'string') {
    // Standardize IBAN: uppercase and remove internal spaces
    settings.ibanNumber = ibanNumber.replace(/\s+/g, '').toUpperCase().trim();
  }

  if (typeof accountTitle === 'string') {
    settings.accountTitle = accountTitle.trim();
  }

  if (typeof jazzCashNumber === 'string') {
    settings.jazzCashNumber = jazzCashNumber.trim();
  }

  if (typeof instructions === 'string') {
    settings.instructions = instructions.trim();
  }

  await settings.save();

  res.status(200).json({
    success: true,
    message: 'Payment settings updated successfully.',
    data: {
      settings: {
        isEnabled: settings.isEnabled,
        feeAmount: settings.feeAmount,
        bankName: settings.bankName,
        ibanNumber: settings.ibanNumber,
        accountTitle: settings.accountTitle,
        jazzCashNumber: settings.jazzCashNumber,
        instructions: settings.instructions,
      },
    },
  });
});

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
};

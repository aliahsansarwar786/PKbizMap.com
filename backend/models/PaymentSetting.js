const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    kind: {
      type: String,
      required: [true, 'Method kind is required'],
      enum: {
        values: ['iban', 'number'],
        message: 'Kind must be either "iban" or "number"',
      },
    },
    accountTitle: {
      type: String,
      required: [true, 'Account title is required'],
      trim: true,
      maxlength: [100, 'Account title cannot exceed 100 characters'],
    },
    accountValue: {
      type: String,
      required: [true, 'Account number or IBAN is required'],
      trim: true,
      maxlength: [50, 'Account value cannot exceed 50 characters'],
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Details cannot exceed 500 characters'],
    },
    cardImage: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      publicId: {
        type: String,
        default: '',
        trim: true,
      },
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const paymentSettingSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false, // Default is OFF so existing listings are not interrupted until Admin turns it on
    },
    feeAmount: {
      type: Number,
      default: 500, // PKR
      min: [0, 'Fee amount cannot be negative'],
    },
    qrCode: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      publicId: {
        type: String,
        default: '',
        trim: true,
      },
    },
    raastId: {
      type: String,
      default: '',
      trim: true,
    },
    accountTitle: {
      type: String,
      default: 'BizPrimeHub',
      trim: true,
    },
    bankName: {
      type: String,
      default: 'Raast Instant Payment',
      trim: true,
    },
    instructions: {
      type: String,
      default: 'Scan this Raast QR code with any banking or wallet app (JazzCash, EasyPaisa, SadaPay, NayaPay, HBL, Meezan, etc.), complete payment, and upload the transaction screenshot below.',
      trim: true,
      maxlength: 500,
    },
    paymentMethods: [paymentMethodSchema],
    // Legacy single JazzCash fields (migrated into paymentMethods array)
    jazzCashNumber: {
      type: String,
      default: '',
      trim: true,
    },
    jazzCashTitle: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper: always fetch or initialize the single configuration document
paymentSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }

  // Automatic Migration: If legacy jazzCashNumber was set, migrate into paymentMethods
  if (settings.jazzCashNumber && settings.jazzCashNumber.trim()) {
    const rawVal = settings.jazzCashNumber.trim();
    if (!settings.paymentMethods) settings.paymentMethods = [];
    const alreadyExists = settings.paymentMethods.some(
      (m) => m.accountValue === rawVal
    );
    if (!alreadyExists) {
      settings.paymentMethods.push({
        name: 'JazzCash',
        kind: 'number',
        accountTitle: settings.jazzCashTitle?.trim() || settings.accountTitle || 'BizPrimeHub',
        accountValue: rawVal,
        details: 'JazzCash Mobile Account',
        cardImage: { url: '', publicId: '' },
        isEnabled: true,
      });
      // Clear legacy fields
      settings.jazzCashNumber = '';
      settings.jazzCashTitle = '';
      await settings.save();
    }
  }

  return settings;
};

module.exports = mongoose.model('PaymentSetting', paymentSettingSchema);

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
    countries: {
      type: [String],
      default: ['Pakistan'],
    },
  },
  { timestamps: true }
);

const DEFAULT_FEES = {
  Pakistan: { amount: 50, currency: 'PKR', symbol: 'Rs.' },
  UAE: { amount: 0, currency: 'AED', symbol: 'AED ' },
  USA: { amount: 0, currency: 'USD', symbol: '$' },
};

const paymentSettingSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: 'main',
      unique: true,
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: false, // Default is OFF so existing listings are not interrupted until Admin turns it on
    },
    // Multi-country fee structure: Fixed currencies, amount editable by admin, 0 = FREE
    fees: {
      Pakistan: {
        amount: { type: Number, default: 50, min: 0 },
        currency: { type: String, default: 'PKR' },
        symbol: { type: String, default: 'Rs.' },
      },
      UAE: {
        amount: { type: Number, default: 0, min: 0 },
        currency: { type: String, default: 'AED' },
        symbol: { type: String, default: 'AED ' },
      },
      USA: {
        amount: { type: Number, default: 0, min: 0 },
        currency: { type: String, default: 'USD' },
        symbol: { type: String, default: '$' },
      },
    },
    feeAmount: {
      type: Number,
      default: 50, // Backward compatibility fallback (mirrors Pakistan fee)
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
    qrEnabled: {
      type: Boolean,
      default: true,
    },
    qrCountries: {
      type: [String],
      default: ['Pakistan'],
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
    // Owner Email Notifications
    ownerNotificationEmail: {
      type: String,
      default: () => process.env.OWNER_NOTIFICATION_EMAIL || '',
      trim: true,
      lowercase: true,
    },
    ownerNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSettingSchema.methods.getFeeForCountry = function (countryName) {
  const c = countryName || 'Pakistan';
  const fees = this.fees || {};
  const matchedKey = Object.keys(fees).find(
    (k) => k.toLowerCase() === c.toLowerCase()
  );
  if (matchedKey && fees[matchedKey]) {
    return fees[matchedKey];
  }
  return {
    amount: this.feeAmount || 0,
    currency: 'PKR',
    symbol: 'Rs.',
  };
};

// Singleton helper: read-only retrieval of the single configuration document
paymentSettingSchema.statics.getSettings = async function () {
  return await this.findOne({ singleton: 'main' }).sort({ _id: 1 });
};

// Startup migration & repair helper: runs strictly on server startup, not on public GET requests
paymentSettingSchema.statics.initOrRepairSettings = async function () {
  // Migrate any existing document missing the singleton key to 'main'
  await this.updateOne(
    { $or: [{ singleton: { $exists: false } }, { singleton: null }, { singleton: '' }] },
    { $set: { singleton: 'main' } }
  );

  let settings = await this.findOneAndUpdate(
    { singleton: 'main' },
    { $setOnInsert: { singleton: 'main' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let modified = false;

  // Initialize or repair fees structure
  if (!settings.fees) {
    settings.fees = { ...DEFAULT_FEES };
    if (settings.feeAmount !== undefined && settings.feeAmount !== null) {
      settings.fees.Pakistan.amount = settings.feeAmount;
    }
    modified = true;
  } else {
    ['Pakistan', 'UAE', 'USA'].forEach((c) => {
      if (!settings.fees[c]) {
        settings.fees[c] = { ...DEFAULT_FEES[c] };
        modified = true;
      } else {
        // Enforce fixed currency & symbol per specification
        if (settings.fees[c].currency !== DEFAULT_FEES[c].currency || settings.fees[c].symbol !== DEFAULT_FEES[c].symbol) {
          settings.fees[c].currency = DEFAULT_FEES[c].currency;
          settings.fees[c].symbol = DEFAULT_FEES[c].symbol;
          modified = true;
        }
      }
    });
  }

  // Sync feeAmount for backward compatibility
  if (settings.fees?.Pakistan?.amount !== undefined && settings.feeAmount !== settings.fees.Pakistan.amount) {
    settings.feeAmount = settings.fees.Pakistan.amount;
    modified = true;
  }

  // Ensure qrCountries is initialized
  if (!settings.qrCountries || !Array.isArray(settings.qrCountries) || settings.qrCountries.length === 0) {
    settings.qrCountries = ['Pakistan'];
    modified = true;
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
        countries: ['Pakistan'],
      });
      // Clear legacy fields
      settings.jazzCashNumber = '';
      settings.jazzCashTitle = '';
      modified = true;
    }
  }

  // Ensure all paymentMethods have countries array
  if (settings.paymentMethods && settings.paymentMethods.length > 0) {
    settings.paymentMethods.forEach((m) => {
      if (!m.countries || !Array.isArray(m.countries) || m.countries.length === 0) {
        m.countries = ['Pakistan'];
        modified = true;
      }
    });
  }

  // Ensure owner notification settings are initialized
  if (settings.ownerNotificationEmail === undefined || settings.ownerNotificationEmail === null) {
    settings.ownerNotificationEmail = process.env.OWNER_NOTIFICATION_EMAIL || '';
    modified = true;
  }
  if (settings.ownerNotificationsEnabled === undefined || settings.ownerNotificationsEnabled === null) {
    settings.ownerNotificationsEnabled = true;
    modified = true;
  }

  if (modified) {
    await settings.save();
  }

  return settings;
};

module.exports = mongoose.model('PaymentSetting', paymentSettingSchema);

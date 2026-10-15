const mongoose = require('mongoose');

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
  return settings;
};

module.exports = mongoose.model('PaymentSetting', paymentSettingSchema);

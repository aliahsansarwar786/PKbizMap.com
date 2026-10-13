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
    bankName: {
      type: String,
      default: 'Mobilink Microfinance Bank (JazzCash)',
      trim: true,
    },
    ibanNumber: {
      type: String,
      default: '',
      trim: true,
    },
    accountTitle: {
      type: String,
      default: 'BizPrimeHub',
      trim: true,
    },
    // Optional mobile number kept for legacy compatibility if admin wants to show it
    jazzCashNumber: {
      type: String,
      default: '',
      trim: true,
    },
    instructions: {
      type: String,
      default: 'Send payment via Raast / 1Link IBFT to the JazzCash IBAN above, then upload transaction screenshot below.',
      trim: true,
      maxlength: 500,
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

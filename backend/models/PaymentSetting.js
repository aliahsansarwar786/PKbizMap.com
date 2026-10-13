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
    jazzCashNumber: {
      type: String,
      default: '03001234567',
      trim: true,
    },
    accountTitle: {
      type: String,
      default: 'BizPrimeHub',
      trim: true,
    },
    instructions: {
      type: String,
      default: 'Please send the listing fee to the JazzCash account above and upload the transaction screenshot below.',
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

const mongoose = require('mongoose');

const otpEmailThrottleSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    firstSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

otpEmailThrottleSchema.index({ email: 1 });
// Auto-expire documents after 1 hour (3600 seconds)
otpEmailThrottleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('OtpEmailThrottle', otpEmailThrottleSchema);

const mongoose = require('mongoose');

const otpIpAttemptSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String, // 'email-verification' | 'password-reset'
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast atomic queries
otpIpAttemptSchema.index({ ip: 1, action: 1 });
// Automatically clean up expired attempt documents after 2 hours (7200 seconds)
otpIpAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('OtpIpAttempt', otpIpAttemptSchema);

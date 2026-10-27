const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['manual', 'spam', 'unspam', 'system'],
      default: 'system',
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ type: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);

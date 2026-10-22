const mongoose = require('mongoose');

const claimRequestSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Claim must be associated with a business'],
      index: true,
    },
    claimantName: {
      type: String,
      required: [true, 'Claimant name or designation is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    emailOption: {
      type: String,
      enum: ['registered', 'direct'],
      default: 'direct',
    },
    chosenEmail: {
      type: String,
      required: [true, 'Verification email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone or WhatsApp number is required'],
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
    },
    codeHash: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAtCode: {
      type: Date,
      required: true,
    },
    expiresAtToken: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'pending_admin', 'approved', 'rejected', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

claimRequestSchema.index({ business: 1, status: 1 });
claimRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ClaimRequest', claimRequestSchema);

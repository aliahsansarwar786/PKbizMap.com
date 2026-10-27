const mongoose = require('mongoose');

const ACTION_ENUM = [
  'approve_business',
  'reject_business',
  'delete_business',
  'delete_user',
  'change_role',
  'spam_user',
  'unspam_user',
  'approve_claim',
  'reject_claim',
  'verify_payment',
  'reject_payment',
  'delete_receipt',
  'delete_review',
  'update_payment_settings',
  'create_payment_method',
  'update_payment_method',
  'delete_payment_method',
  'toggle_payment_method',
  'delete_payment_qr',
];

const TARGET_TYPE_ENUM = ['business', 'user', 'review', 'claim', 'payment', 'settings'];

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      enum: ACTION_ENUM,
      required: true,
    },
    targetType: {
      type: String,
      enum: TARGET_TYPE_ENUM,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetLabel: {
      type: String,
      default: '',
      trim: true,
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

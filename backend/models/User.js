const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'subadmin'],
      default: 'user',
    },
    permissions: {
      canApproveListings: {
        type: Boolean,
        default: false,
      },
      canDeleteListings: {
        type: Boolean,
        default: false,
      },
      canModerateReviews: {
        type: Boolean,
        default: false,
      },
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationOTPExpires: {
      type: Date,
      select: false,
    },
    emailVerificationOTPAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    emailVerificationOTPBlockedUntil: {
      type: Date,
      select: false,
    },
    emailVerificationLastResend: {
      type: Date,
      select: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOTPAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    resetPasswordOTPBlockedUntil: {
      type: Date,
      select: false,
    },
    resetPasswordLastResend: {
      type: Date,
      select: false,
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false, // Legacy field
    },
    resetPasswordExpire: {
      type: Date,
      select: false, // Legacy field
    },
    passwordChangedAt: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password has been modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Method: Compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Safe JSON output: Strip sensitive fields ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpires;
  delete obj.emailVerificationOTPAttempts;
  delete obj.emailVerificationOTPBlockedUntil;
  delete obj.emailVerificationLastResend;
  delete obj.resetPasswordOTP;
  delete obj.resetPasswordOTPExpires;
  delete obj.resetPasswordOTPAttempts;
  delete obj.resetPasswordOTPBlockedUntil;
  delete obj.resetPasswordLastResend;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordTokenExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

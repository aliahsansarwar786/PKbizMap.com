const mongoose = require('mongoose');

const CATEGORIES = [
  'IT',
  'Real Estate',
  'Restaurant',
  'Healthcare',
  'Education',
  'Automotive',
  'Retail',
  'Construction',
  'Finance',
  'Beauty',
  'Travel',
  'Professional Services',
  'Other',
];

const businessSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Business title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },
    website: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/,
        'Please provide a valid website URL',
      ],
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: {
        type: String,
        trim: true,
        required: [true, 'City is required'],
        maxlength: 100,
      },
      zipCode: { type: String, trim: true, maxlength: 20 },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Business must have an owner'],
    },
    isApproved: {
      type: Boolean,
      default: false, // All new businesses start unapproved
    },
    // Denormalized average rating for fast queries
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
businessSchema.index({ owner: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ isApproved: 1 });
businessSchema.index({ createdAt: -1 });
// Text search index
businessSchema.index(
  { title: 'text', description: 'text', category: 'text', 'address.city': 'text' },
  { weights: { title: 10, category: 5, 'address.city': 3, description: 1 } }
);

// ─── Export constants too ─────────────────────────────────────────────────────
businessSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Business', businessSchema);
module.exports.CATEGORIES = CATEGORIES;

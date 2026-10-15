const mongoose = require('mongoose');

const CATEGORIES = [
  'Bank',
  'Laboratory',
  'Bus Companies',
  'Information Technology (IT) & Services',
  'Hospital',
  'Local Shops & Traders',
  'Education',
  'Shopping & Retail Chains',
  'Real Estate',
  'Restaurants & Food Chains',
  'Importer and Exporter',
  'Courier & Cargo Companies',
  'Hotels & Guest Houses',
  'Telecom Companies',
  'IT',
  'Restaurant',
  'Healthcare',
  'Automotive',
  'Retail',
  'Construction',
  'Finance',
  'Beauty',
  'Travel',
  'Professional Services',
  'Hotels & Hospitality',
  'Home Services',
  'Fashion & Clothing',
  'Electronics & Mobiles',
  'Sports & Fitness',
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
    subcategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Subcategory cannot exceed 100 characters'],
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
      default: '',
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
      match: [/^[+\d\s\-().]{7,25}$/, 'Please provide a valid phone number'],
    },
    whatsapp: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,25}$/, 'Please provide a valid WhatsApp number'],
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    socialLinks: {
      facebook: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      googleBusiness: { type: String, trim: true, default: '' },
    },
    address: {
      street: { type: String, trim: true, maxlength: 200, default: '' },
      area: { type: String, trim: true, maxlength: 100, default: '' },
      city: {
        type: String,
        trim: true,
        required: [true, 'City is required'],
        maxlength: 100,
      },
      country: {
        type: String,
        trim: true,
        required: [true, 'Country is required'],
        enum: {
          values: ['Pakistan', 'UAE', 'USA'],
          message: 'Country must be Pakistan, UAE, or USA',
        },
        default: 'Pakistan',
      },
      zipCode: { type: String, trim: true, maxlength: 20, default: '' },
    },
    openingHours: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    paymentReceipt: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    paymentStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
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
businessSchema.index({ 'address.country': 1 });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ 'address.country': 1, 'address.city': 1 });
businessSchema.index({ isApproved: 1 });
businessSchema.index({ createdAt: -1 });
// Text search index
businessSchema.index(
  { title: 'text', description: 'text', category: 'text', 'address.city': 'text', 'address.country': 'text' },
  { weights: { title: 10, category: 5, 'address.city': 3, 'address.country': 2, description: 1 } }
);

// ─── Export constants too ─────────────────────────────────────────────────────
businessSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Business', businessSchema);
module.exports.CATEGORIES = CATEGORIES;

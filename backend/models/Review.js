const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Review must belong to a business'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
reviewSchema.index({ business: 1 });
reviewSchema.index({ user: 1 });
// Compound unique: one review per user per business
reviewSchema.index({ business: 1, user: 1 }, { unique: true });

// ─── Static: Recalculate business average rating ──────────────────────────────
reviewSchema.statics.calcAverageRating = async function (businessId) {
  const Business = require('./Business');

  const stats = await this.aggregate([
    { $match: { business: businessId } },
    {
      $group: {
        _id: '$business',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  } else {
    await Business.findByIdAndUpdate(businessId, {
      averageRating: 0,
      reviewCount: 0,
    });
  }
};

// ─── Post-save hook: Recalculate rating after review created/updated ──────────
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.business);
});

// ─── Post-remove hook: Recalculate rating after review deleted ────────────────
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.business);
  }
});

module.exports = mongoose.model('Review', reviewSchema);

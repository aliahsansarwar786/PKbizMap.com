'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI, reviewAPI } from '@/lib/api';
import { StarRating } from './BusinessCard';
import toast from 'react-hot-toast';
import {
  MapPin, Phone, Mail, Globe, Tag, Calendar,
  User, ChevronLeft, Star, Edit3, Trash2, Send,
  Clock, Share2
} from 'lucide-react';

function WhatsAppIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function ReviewForm({ businessId, onSubmit, existingReview = null }) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      toast.error('Comment must be at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ rating, comment });
      if (!existingReview) {
        setComment('');
        setRating(5);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Star picker */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill={(hover || rating) >= star ? '#f59e0b' : '#d1d5db'} aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem', alignSelf: 'center' }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this business... (min 10 characters)"
        rows={3}
        className="input-field mb-3"
        style={{ resize: 'vertical', minHeight: 80 }}
        maxLength={1000}
        aria-label="Review comment"
        required
      />

      <div className="flex items-center justify-between">
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{comment.length}/1000</span>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
          {loading ? <span className="spinner" /> : <Send size={14} />}
          {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

export default function BusinessDetail({ id }) {
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [editingReview, setEditingReview] = useState(null);

  const userReview = reviews.find((r) => r.user?._id === user?._id);

  useEffect(() => {
    businessAPI.getById(id)
      .then((res) => {
        setBusiness(res.data.business);
        setReviews(res.data.reviews || []);
      })
      .catch((err) => setError(err.message || 'Business not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateReview = async (data) => {
    const res = await reviewAPI.create(id, data);
    setReviews((prev) => [res.data.review, ...prev]);
    // Update average on business
    setBusiness((prev) => ({
      ...prev,
      reviewCount: (prev.reviewCount || 0) + 1,
      averageRating: ((prev.averageRating * (prev.reviewCount || 0)) + data.rating) / ((prev.reviewCount || 0) + 1),
    }));
    toast.success('Review submitted!');
  };

  const handleUpdateReview = async (data) => {
    const res = await reviewAPI.update(editingReview._id, data);
    setReviews((prev) => prev.map((r) => r._id === editingReview._id ? res.data.review : r));
    setEditingReview(null);
    toast.success('Review updated!');
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    await reviewAPI.delete(reviewId);
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    toast.success('Review deleted.');
  };

  if (loading) {
    return (
      <div className="section container-max">
        <div className="skeleton h-72 rounded-xl mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 rounded" style={{ width: '60%' }} />
            <div className="skeleton h-4 rounded" style={{ width: '40%' }} />
            <div className="skeleton h-32 rounded" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section container-max text-center">
        <div className="card p-10 max-w-md mx-auto">
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          <Link href="/businesses" className="btn-secondary">
            <ChevronLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const allImages = business.images?.length > 0 ? business.images : [];
  const displayImage = allImages[activeImage]?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(business.title)}&background=2563eb&color=fff&size=800&bold=true&format=png`;

  const isOwner = user?._id === business.owner?._id;

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* Back link */}
        <Link
          href="/businesses"
          className="inline-flex items-center gap-1 mb-4 text-sm hover:text-blue-600 transition-colors"
          style={{ color: '#6b7280' }}
        >
          <ChevronLeft size={16} /> Back to Directory
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Main content ────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="card overflow-hidden">
              <div className="relative" style={{ height: 340, background: '#f3f4f6' }}>
                <Image
                  src={displayImage}
                  alt={business.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-2 p-3" style={{ overflowX: 'auto' }}>
                  {allImages.map((img, i) => (
                    <button
                      key={img.publicId}
                      onClick={() => setActiveImage(i)}
                      className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 60, height: 60,
                        border: i === activeImage ? '2px solid #2563eb' : '2px solid transparent',
                        opacity: i === activeImage ? 1 : 0.7,
                      }}
                      aria-label={`View image ${i + 1}`}
                    >
                      <Image src={img.url} alt={`${business.title} image ${i + 1}`} width={60} height={60} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Business info */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-blue"><Tag size={11} /> {business.category}</span>
                  </div>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1f2937' }}>
                    {business.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {[business.address?.street, business.address?.city, business.address?.country || 'Pakistan', business.address?.zipCode]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <div className="mt-2">
                    <StarRating rating={business.averageRating || 0} count={business.reviewCount || 0} size={16} />
                  </div>
                </div>

                {isOwner && (
                  <Link
                    href={`/dashboard/businesses/${business._id}`}
                    className="btn-secondary flex-shrink-0"
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                  >
                    <Edit3 size={14} /> Edit
                  </Link>
                )}
              </div>

              <hr className="divider" />

              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>
                About This Business
              </h2>
              <p className="break-words" style={{ color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'break-word', marginBottom: '1.5rem' }}>
                {business.description}
              </p>

              {business.address && (business.address.street || business.address.city) && (
                <>
                  <hr className="divider" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
                    Location
                  </h2>
                  <div className="w-full h-64 rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight="0" 
                      marginWidth="0" 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent([business.address.street, business.address.city, business.address.zipCode].filter(Boolean).join(', '))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      title={`${business.title} Location`}
                      style={{ filter: 'contrast(1.05)' }}
                    ></iframe>
                  </div>
                </>
              )}
            </div>

            {/* Reviews */}
            <div className="card p-6">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
                Customer Reviews ({reviews.length})
              </h2>

              {/* Review form */}
              {isAuthenticated && !isOwner && !userReview && (
                <div className="mb-6">
                  <ReviewForm businessId={id} onSubmit={handleCreateReview} />
                </div>
              )}

              {isAuthenticated && !isOwner && userReview && !editingReview && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: '0.875rem', color: '#1d4ed8', marginBottom: '0.5rem' }}>
                    You have already reviewed this business.
                  </p>
                  <button onClick={() => setEditingReview(userReview)} className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                    <Edit3 size={13} /> Edit My Review
                  </button>
                </div>
              )}

              {editingReview && (
                <div className="mb-6">
                  <ReviewForm businessId={id} onSubmit={handleUpdateReview} existingReview={editingReview} />
                  <button onClick={() => setEditingReview(null)} className="text-sm mt-2" style={{ color: '#6b7280' }}>Cancel</button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="mb-6 p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <Link href="/login" style={{ color: '#2563eb' }}>Log in</Link> to leave a review.
                  </p>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star size={32} style={{ color: '#d1d5db', margin: '0 auto 0.75rem' }} />
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No reviews yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const reviewerAvatar = review.user?.avatar?.url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'U')}&background=2563eb&color=fff&size=40`;
                    const isAuthor = user?._id === review.user?._id;
                    const isAdmin = user?.role === 'admin';

                    return (
                      <div
                        key={review._id}
                        className="p-4 rounded-xl"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={reviewerAvatar}
                              alt={review.user?.name || 'Reviewer'}
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>
                                {review.user?.name || 'Anonymous'}
                              </p>
                              <StarRating rating={review.rating} size={12} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            {(isAuthor || isAdmin) && (
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                aria-label="Delete review"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="break-words" style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.75rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
                          {review.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Contact sidebar ────────────────────────── */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="card p-5">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
                Contact & Actions
              </h2>

              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg mb-2 w-full transition-colors hover:bg-blue-50"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937', textDecoration: 'none' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
                    <Phone size={15} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phone</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{business.phone}</p>
                  </div>
                </a>
              )}

              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg mb-2 w-full transition-colors hover:bg-emerald-50"
                  style={{ border: '1px solid #bbf7d0', color: '#1f2937', textDecoration: 'none' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <WhatsAppIcon size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>WhatsApp</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600 }} className="text-emerald-700">{business.whatsapp}</p>
                  </div>
                </a>
              )}

              {business.contactPerson && (
                <div className="flex items-center gap-3 p-3 rounded-lg mb-2 w-full bg-gray-50/70 border border-gray-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                    <User size={15} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Contact Person</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{business.contactPerson}</p>
                  </div>
                </div>
              )}

              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg mb-2 w-full transition-colors hover:bg-blue-50"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937', textDecoration: 'none' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
                    <Mail size={15} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Email</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }} className="truncate">{business.email}</p>
                  </div>
                </a>
              )}

              {business.website && (
                <a
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg mb-2 w-full transition-colors hover:bg-blue-50"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937', textDecoration: 'none' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
                    <Globe size={15} style={{ color: '#2563eb' }} />
                  </div>
                  <div className="overflow-hidden">
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Website</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2563eb' }} className="truncate">
                      {business.website}
                    </p>
                  </div>
                </a>
              )}

              {business.address?.city && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent([business.address?.street, business.address?.city].filter(Boolean).join(', '))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg w-full transition-colors hover:bg-blue-50"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937', textDecoration: 'none' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
                    <MapPin size={15} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Get Directions</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {[business.address?.street, business.address?.area, business.address?.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </a>
              )}

              {/* Social Links if present */}
              {(business.socialLinks?.facebook || business.socialLinks?.youtube || business.socialLinks?.googleBusiness) && (
                <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                  {business.socialLinks.facebook && (
                    <a
                      href={business.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {business.socialLinks.youtube && (
                    <a
                      href={business.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      YouTube
                    </a>
                  )}
                  {business.socialLinks.googleBusiness && (
                    <a
                      href={business.socialLinks.googleBusiness}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Google Profile
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Business meta */}
            <div className="card p-5">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>
                Business Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Category: <strong>{business.category}</strong></span>
                </div>
                {business.subcategory && (
                  <div className="flex items-center gap-2">
                    <Tag size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Subcategory: <strong>{business.subcategory}</strong></span>
                  </div>
                )}
                {business.address?.area && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Area: <strong>{business.address.area}</strong></span>
                  </div>
                )}
                {business.address?.zipCode && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>ZIP: <strong>{business.address.zipCode}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                    Listed: <strong>{new Date(business.createdAt).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Opening Hours Card (Backward Compatible: "Hours not specified" if missing) */}
            <div className="card p-5">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }} className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                Weekly Opening Hours
              </h2>
              {business.openingHours && typeof business.openingHours === 'object' && Object.keys(business.openingHours).length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const d = business.openingHours[day];
                    if (!d) return null;
                    const label = day.charAt(0).toUpperCase() + day.slice(1);
                    return (
                      <div key={day} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                        <span className="font-semibold text-gray-700">{label}</span>
                        {d.closed ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-[11px]">Closed</span>
                        ) : (
                          <span className="text-gray-600 font-medium">{d.open || '09:00'} - {d.close || '18:00'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Hours not specified</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

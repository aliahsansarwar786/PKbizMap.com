'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI, reviewAPI } from '@/lib/api';
import BusinessCard, { StarRating } from './BusinessCard';
import ClaimBusinessModal from './ClaimBusinessModal';
import toast from 'react-hot-toast';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  User,
  ChevronLeft,
  Star,
  Edit3,
  Trash2,
  Send,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

function WhatsAppIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// Helper to check whether a URL has an http: or https: scheme
function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper to format full address without duplicate city
function formatAddress(address) {
  if (!address) return '';
  const street = (address.street || '').trim();
  const area = (address.area || '').trim();
  const city = (address.city || '').trim();
  const country = (address.country || 'Pakistan').trim();
  const zipCode = (address.zipCode || '').trim();

  let displayStreet = street;
  let includeCity = Boolean(city);

  if (city) {
    const cityLower = city.toLowerCase();
    const regex = new RegExp(`(?:,\\s*|\\s+)${cityLower}$`, 'i');
    if (street.toLowerCase() === cityLower || regex.test(street)) {
      includeCity = false;
    }
  }

  let displayArea = area;
  if (area && city && area.toLowerCase() === city.toLowerCase()) {
    displayArea = '';
  }

  const parts = [
    displayStreet,
    displayArea,
    includeCity ? city : '',
    country,
    zipCode,
  ].filter(Boolean);

  return parts.join(', ');
}

// Helper to format short address without duplicate city
function formatShortAddress(address) {
  if (!address) return '';
  const street = (address.street || '').trim();
  const area = (address.area || '').trim();
  const city = (address.city || '').trim();

  let includeCity = Boolean(city);
  if (city) {
    const cityLower = city.toLowerCase();
    const regex = new RegExp(`(?:,\\s*|\\s+)${cityLower}$`, 'i');
    if (street.toLowerCase() === cityLower || regex.test(street)) {
      includeCity = false;
    }
  }

  let displayArea = area;
  if (area && city && area.toLowerCase() === city.toLowerCase()) {
    displayArea = '';
  }

  return [street, displayArea, includeCity ? city : ''].filter(Boolean).join(', ');
}

// Review form accepting both guest and authenticated users
function ReviewForm({ businessId, onSubmit, existingReview = null, currentUser = null }) {
  const [name, setName] = useState(existingReview?.guestName || currentUser?.name || '');
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name && currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Comment must be at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), rating, comment });
      if (!existingReview) {
        setComment('');
        if (!currentUser) setName('');
        setRating(5);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-gray-200">
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Reviewer Name */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name (e.g. Ali Ahmed)"
          className="input-field text-sm"
        />
      </div>

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
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [similarBusinesses, setSimilarBusinesses] = useState([]);

  const userReview = reviews.find((r) => r.user?._id && user?._id && r.user._id === user._id);

  useEffect(() => {
    businessAPI.getById(id)
      .then((res) => {
        setBusiness(res.data.business);
        setReviews(res.data.reviews || []);
      })
      .catch((err) => setError(err.message || 'Business not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch similar businesses in same category and city
  useEffect(() => {
    if (business?.category && business?.address?.city) {
      businessAPI.getAll({
        category: business.category,
        city: business.address.city,
        limit: 6,
      })
        .then((res) => {
          const list = (res.data?.businesses || res.businesses || [])
            .filter((b) => b._id !== business._id && b.slug !== business.slug)
            .slice(0, 4);
          setSimilarBusinesses(list);
        })
        .catch(() => setSimilarBusinesses([]));
    }
  }, [business]);

  const handleCreateReview = async (data) => {
    const res = await reviewAPI.create(business?.slug || id, data);
    const newRev = res.data?.review || res.review;
    setReviews((prev) => [newRev, ...prev]);

    // Update average and count on business
    setBusiness((prev) => {
      const currentCount = prev.reviewCount || 0;
      const currentAvg = prev.averageRating || 0;
      const nextCount = currentCount + 1;
      const nextAvg = (currentAvg * currentCount + data.rating) / nextCount;
      return {
        ...prev,
        reviewCount: nextCount,
        averageRating: Math.round(nextAvg * 10) / 10,
      };
    });

    toast.success('Review submitted successfully!');
  };

  const handleUpdateReview = async (data) => {
    const res = await reviewAPI.update(editingReview._id, data);
    setReviews((prev) => prev.map((r) => r._id === editingReview._id ? (res.data?.review || res.review) : r));
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

  const isOwner = user?._id && business.owner?._id && user._id === business.owner._id;
  const isClaimed = Boolean(business.isClaimed || business.claimed);

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* Visible Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="mb-3 text-xs sm:text-sm text-gray-500">
          <ol className="flex items-center flex-wrap gap-1.5 leading-normal">
            <li className="flex items-center gap-1.5">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span className="text-gray-400 select-none">›</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Link href="/businesses" className="hover:text-blue-600 transition-colors">
                Businesses
              </Link>
              <span className="text-gray-400 select-none">›</span>
            </li>
            {business.category && (
              <li className="flex items-center gap-1.5">
                <Link
                  href={`/businesses?category=${encodeURIComponent(business.category)}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {business.category}
                </Link>
                <span className="text-gray-400 select-none">›</span>
              </li>
            )}
            <li
              className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg"
              title={business.title}
              aria-current="page"
            >
              {business.title}
            </li>
          </ol>
        </nav>

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
            {/* Image gallery / Logo: Shown at NATURAL size & aspect ratio, centered in soft background */}
            <div className="card overflow-hidden border border-gray-100">
              <div
                className="relative w-full flex items-center justify-center bg-slate-50/90 p-4 sm:p-6"
                style={{ minHeight: 220, maxHeight: 280, height: 260 }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={displayImage}
                    alt={`${business.title} — ${business.category || 'Business'}${business.address?.city ? ` in ${business.address.city}` : ''}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                    className="object-contain p-2 max-h-[250px] drop-shadow-2xs"
                    priority
                  />
                </div>
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 bg-white border-t border-gray-100" style={{ overflowX: 'auto' }}>
                  {allImages.map((img, i) => (
                    <button
                      key={img.publicId || i}
                      onClick={() => setActiveImage(i)}
                      className="flex-shrink-0 rounded-lg overflow-hidden transition-all bg-slate-50 p-1 cursor-pointer"
                      style={{
                        width: 60,
                        height: 60,
                        border: i === activeImage ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        opacity: i === activeImage ? 1 : 0.6,
                      }}
                      aria-label={`View image ${i + 1}`}
                    >
                      <Image
                        src={img.url}
                        alt={`${business.title} thumbnail ${i + 1}`}
                        width={56}
                        height={56}
                        className="object-contain w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Business info */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="badge badge-blue"><Tag size={11} /> {business.category}</span>
                    {!isClaimed && (
                      <button
                        type="button"
                        onClick={() => setClaimModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <ShieldCheck size={13} className="text-amber-600" />
                        <span>Claim This Business</span>
                      </button>
                    )}
                    {isClaimed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Verified Listing</span>
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1f2937' }}>
                    {business.title}
                  </h1>

                  <div className="flex items-center gap-2 mt-2">
                    <MapPin size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatAddress(business.address)}
                    </span>
                  </div>

                  <div className="mt-2.5">
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

            {/* Customer Reviews */}
            <div className="card p-6">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
                Customer Reviews ({reviews.length})
              </h2>

              {/* Review form: ALWAYS VISIBLE - guests and authenticated visitors can write reviews */}
              {!editingReview && (!userReview || !isAuthenticated) && (
                <div className="mb-6">
                  <ReviewForm
                    businessId={id}
                    onSubmit={handleCreateReview}
                    currentUser={user}
                  />
                </div>
              )}

              {/* Logged in user who already reviewed: show edit option */}
              {isAuthenticated && userReview && !editingReview && (
                <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-blue-900 font-medium">
                    You have already reviewed this business.
                  </p>
                  <button
                    onClick={() => setEditingReview(userReview)}
                    className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                  >
                    <Edit3 size={13} /> Edit My Review
                  </button>
                </div>
              )}

              {/* Editing review form */}
              {editingReview && (
                <div className="mb-6">
                  <ReviewForm
                    businessId={id}
                    onSubmit={handleUpdateReview}
                    existingReview={editingReview}
                    currentUser={user}
                  />
                  <button
                    onClick={() => setEditingReview(null)}
                    className="text-sm mt-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star size={32} style={{ color: '#d1d5db', margin: '0 auto 0.75rem' }} />
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No reviews yet. Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const reviewerName = review.guestName || review.user?.name || 'Anonymous';
                    const reviewerAvatar = review.user?.avatar?.url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=2563eb&color=fff&size=40`;
                    const isAuthor = user?._id && review.user?._id && user._id === review.user._id;
                    const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

                    return (
                      <div
                        key={review._id}
                        className="p-4 rounded-xl bg-slate-50/60 border border-gray-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={reviewerAvatar}
                              alt={reviewerName}
                              width={36}
                              height={36}
                              className="rounded-full object-cover shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>
                                  {reviewerName}
                                </p>
                                {!review.user && (
                                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                    Guest
                                  </span>
                                )}
                              </div>
                              <StarRating rating={review.rating} count={1} size={12} />
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
                        <p className="break-words mt-3 text-sm text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task 6: Similar Businesses Section */}
            {similarBusinesses.length > 0 && (
              <div className="card p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>
                    Similar {business.category} in {business.address?.city || 'Pakistan'}
                  </h2>
                  <Link
                    href={`/businesses?category=${encodeURIComponent(business.category)}&city=${encodeURIComponent(business.address?.city || '')}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {similarBusinesses.map((simBiz) => (
                    <BusinessCard key={simBiz._id} business={simBiz} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ────────────────────────────────── */}
          <div className="space-y-4">
            {/* Professional Details (Contact & Location Card) */}
            <div className="card p-5 space-y-3 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1f2937' }}>
                  Professional Details
                </h2>
                {isClaimed && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Owner
                  </span>
                )}
              </div>

              {/* Address with Map/Directions link */}
              {business.address && (business.address.street || business.address.city || business.address.area) && (
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-500 font-medium">Address</p>
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {formatAddress(business.address)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 pl-6">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(business.address))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Navigation size={12} /> Get Directions
                    </a>
                  </div>
                </div>
              )}

              {/* Phone as a call row */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                      <Phone size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 font-medium">Phone</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{business.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">Call</span>
                </a>
              )}

              {/* WhatsApp as a green "Chat" button */}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi, I found ${business.title} on BizPrimeHub and would like to inquire about your services.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <WhatsAppIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-emerald-100 font-medium">WhatsApp</p>
                      <p className="text-xs sm:text-sm font-bold text-white truncate">{business.whatsapp}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white text-emerald-700 px-3 py-1 rounded-lg group-hover:bg-emerald-50 transition-colors shrink-0">
                    Chat
                  </span>
                </a>
              )}

              {/* Contact Person (if exists) */}
              {business.contactPerson && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/40">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                    <User size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-medium">Contact Person</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{business.contactPerson}</p>
                  </div>
                </div>
              )}

              {/* Email row (if exists) */}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-500 font-medium">Email</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{business.email}</p>
                  </div>
                </a>
              )}

              {/* Website "Visit" row (if exists) */}
              {business.website && (
                isSafeUrl(business.website) ? (
                  <a
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                        <Globe size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Website</p>
                        <p className="text-xs sm:text-sm font-semibold text-blue-600 truncate">{business.website}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">Visit</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500 shrink-0">
                        <Globe size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Website</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{business.website}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Prominent Claim This Business button if not claimed */}
              {!isClaimed && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <ShieldCheck size={16} />
                    <span>Claim This Business</span>
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-1.5">
                    Verified owner? Claim to update information &amp; manage leads
                  </p>
                </div>
              )}

              {/* Social Links if present */}
              {(business.socialLinks?.facebook || business.socialLinks?.youtube || business.socialLinks?.googleBusiness) && (
                <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                  {business.socialLinks.facebook && (
                    isSafeUrl(business.socialLinks.facebook) ? (
                      <a
                        href={business.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Facebook
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                        Facebook: {business.socialLinks.facebook}
                      </span>
                    )
                  )}
                  {business.socialLinks.youtube && (
                    isSafeUrl(business.socialLinks.youtube) ? (
                      <a
                        href={business.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        YouTube
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                        YouTube: {business.socialLinks.youtube}
                      </span>
                    )
                  )}
                  {business.socialLinks.googleBusiness && (
                    isSafeUrl(business.socialLinks.googleBusiness) ? (
                      <a
                        href={business.socialLinks.googleBusiness}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Google Profile
                      </a>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                        Google Profile: {business.socialLinks.googleBusiness}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Business Details (NO "Listed: <date>" row) */}
            <div className="card p-5 border border-gray-100">
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
              </div>
            </div>

            {/* Weekly Opening Hours */}
            <div className="card p-5 border border-gray-100">
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

      {/* Claim Business Modal */}
      <ClaimBusinessModal
        business={business}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
      />
    </div>
  );
}

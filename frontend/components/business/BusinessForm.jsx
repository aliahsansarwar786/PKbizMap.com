'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Upload, X, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'IT', 'Real Estate', 'Restaurant', 'Healthcare', 'Education',
  'Automotive', 'Retail', 'Construction', 'Finance', 'Beauty',
  'Travel', 'Professional Services', 'Other',
];

const MAX_IMAGES = 5;

export default function BusinessForm({ existingBusiness = null }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const isEdit = !!existingBusiness;

  const [form, setForm] = useState({
    title: existingBusiness?.title || '',
    description: existingBusiness?.description || '',
    category: existingBusiness?.category || '',
    email: existingBusiness?.email || '',
    phone: existingBusiness?.phone || '',
    website: existingBusiness?.website || '',
    street: existingBusiness?.address?.street || '',
    city: existingBusiness?.address?.city || '',
    zipCode: existingBusiness?.address?.zipCode || '',
  });

  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = (existingBusiness?.images?.length || 0) + newImages.length;
    const remaining = MAX_IMAGES - currentTotal;

    if (files.length > remaining) {
      toast.error(`You can only upload ${remaining} more image${remaining !== 1 ? 's' : ''}.`);
      return;
    }

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error('Each image must be under 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalid = files.filter((f) => !validTypes.includes(f.type));
    if (invalid.length > 0) {
      toast.error('Only JPG, JPEG, PNG, and WebP files are allowed.');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.length < 2) errs.title = 'Business title is required (min 2 chars)';
    if (!form.description.trim() || form.description.length < 20) errs.description = 'Description must be at least 20 characters';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.city.trim()) errs.city = 'City is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      if (form.email) formData.append('email', form.email.toLowerCase());
      if (form.phone) formData.append('phone', form.phone.trim());
      if (form.website) formData.append('website', form.website.trim());
      formData.append('address[city]', form.city.trim());
      if (form.street) formData.append('address[street]', form.street.trim());
      if (form.zipCode) formData.append('address[zipCode]', form.zipCode.trim());
      newImages.forEach((img) => formData.append('images', img));

      if (isEdit) {
        await businessAPI.update(existingBusiness._id, formData);
        toast.success('Business updated. Pending re-approval.');
        router.push('/dashboard');
      } else {
        await businessAPI.create(formData);
        toast.success('Business submitted! Pending admin approval.');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6" noValidate>
      {/* Approval notice */}
      <div className="flex gap-3 p-4 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
          New listings require admin approval before becoming publicly visible. This usually takes up to 24 hours.
        </p>
      </div>

      {/* Basic info */}
      <section aria-label="Basic information">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
          Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="biz-title" className="form-label">
              Business Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="biz-title"
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g., Sunrise Coffee Shop"
              className={`input-field ${errors.title ? 'error' : ''}`}
              maxLength={100}
              aria-required="true"
              aria-invalid={!!errors.title}
            />
            {errors.title && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="biz-category" className="form-label">
              Category <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="biz-category"
              value={form.category}
              onChange={set('category')}
              className={`select-field ${errors.category ? 'error' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.category}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.category}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="biz-description" className="form-label">
              Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              id="biz-description"
              value={form.description}
              onChange={set('description')}
              placeholder="Describe your business, services, and what makes you unique... (min 20 characters)"
              rows={4}
              className={`input-field ${errors.description ? 'error' : ''}`}
              style={{ resize: 'vertical' }}
              maxLength={2000}
              aria-required="true"
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between">
              {errors.description
                ? <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.description}</p>
                : <span />}
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{form.description.length}/2000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section aria-label="Contact information">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="biz-email" className="form-label">Business Email</label>
            <input
              id="biz-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="contact@yourbusiness.com"
              className={`input-field ${errors.email ? 'error' : ''}`}
              autoComplete="off"
            />
            {errors.email && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="biz-phone" className="form-label">Phone Number</label>
            <input
              id="biz-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+1 (555) 000-0000"
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="biz-website" className="form-label">Website</label>
            <input
              id="biz-website"
              type="url"
              value={form.website}
              onChange={set('website')}
              placeholder="https://yourbusiness.com"
              className="input-field"
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section aria-label="Address">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
          Location
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label htmlFor="biz-street" className="form-label">Street Address</label>
            <input
              id="biz-street"
              type="text"
              value={form.street}
              onChange={set('street')}
              placeholder="123 Main Street"
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="biz-city" className="form-label">
              City <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="biz-city"
              type="text"
              value={form.city}
              onChange={set('city')}
              placeholder="New York"
              className={`input-field ${errors.city ? 'error' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.city}
            />
            {errors.city && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="biz-zip" className="form-label">ZIP / Postal Code</label>
            <input
              id="biz-zip"
              type="text"
              value={form.zipCode}
              onChange={set('zipCode')}
              placeholder="10001"
              className="input-field"
              maxLength={20}
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section aria-label="Business images">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
          Business Images
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '1rem' }}>
          Upload up to {MAX_IMAGES} images. JPG, PNG, or WebP. Max 5MB each.
        </p>

        {/* Existing images in edit mode */}
        {isEdit && existingBusiness?.images?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {existingBusiness.images.map((img, i) => (
              <div key={img.publicId} className="relative rounded-lg overflow-hidden" style={{ width: 72, height: 72, border: '2px solid #e5e7eb' }}>
                <Image src={img.url} alt={`Business image ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '0.6rem', color: '#fff' }}>Existing</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New image previews */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {previews.map((src, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden" style={{ width: 72, height: 72, border: '2px solid #bfdbfe' }}>
                <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#dc2626', border: 'none', cursor: 'pointer' }}
                  aria-label={`Remove image ${i + 1}`}
                >
                  <X size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {(existingBusiness?.images?.length || 0) + newImages.length < MAX_IMAGES && (
          <label
            htmlFor="biz-images"
            className="flex flex-col items-center gap-2 p-6 rounded-xl cursor-pointer transition-colors"
            style={{
              border: '2px dashed #d1d5db',
              background: '#f9fafb',
            }}
          >
            <Upload size={24} style={{ color: '#9ca3af' }} aria-hidden="true" />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563' }}>
              Click to upload images
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              JPG, PNG, WebP up to 5MB each
            </span>
            <input
              id="biz-images"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageSelect}
              className="sr-only"
              aria-label="Upload business images"
            />
          </label>
        )}
      </section>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          {loading
            ? (isEdit ? 'Updating...' : 'Submitting...')
            : (isEdit ? 'Update Business' : 'Submit for Approval')}
        </button>
      </div>
    </form>
  );
}

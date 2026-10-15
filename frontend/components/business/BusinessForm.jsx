'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI, settingsAPI, adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Upload, X, AlertCircle, CreditCard, Copy, Check, FileCheck, QrCode, Download } from 'lucide-react';
import SearchableCombobox from '@/components/ui/SearchableCombobox';
import { COUNTRIES, getCities, isValidCity } from '@/data/locations';

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
  'Other',
];

const MAX_IMAGES = 5;

export default function BusinessForm({
  existingBusiness = null,
  isAdminEdit = false,
  onAdminSaved = null,
  onCancel = null,
}) {
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
    country: existingBusiness?.address?.country || 'Pakistan',
    city: existingBusiness?.address?.city || '',
    zipCode: existingBusiness?.address?.zipCode || '',
  });

  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(existingBusiness?.images || []);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState(null);
  const [copiedRaastId, setCopiedRaastId] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleCopyRaastId = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    setCopiedRaastId(true);
    toast.success('Raast ID copied to clipboard!');
    setTimeout(() => setCopiedRaastId(false), 2500);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isEdit) {
      settingsAPI.getPayment()
        .then((res) => setPaymentSettings(res.data?.settings || null))
        .catch(() => {});
    }
  }, [isEdit]);

  useEffect(() => {
    if (existingBusiness) {
      setForm({
        title: existingBusiness.title || '',
        description: existingBusiness.description || '',
        category: existingBusiness.category || '',
        email: existingBusiness.email || '',
        phone: existingBusiness.phone || '',
        website: existingBusiness.website || '',
        street: existingBusiness.address?.street || '',
        country: existingBusiness.address?.country || 'Pakistan',
        city: existingBusiness.address?.city || '',
        zipCode: existingBusiness.address?.zipCode || '',
      });
      setExistingImages(existingBusiness.images || []);
    }
  }, [existingBusiness]);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setForm((prev) => ({
      ...prev,
      country: newCountry,
      city: '', // Reset dependent city when country changes
    }));
    if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  const handleCityChange = (newCity) => {
    setForm((prev) => ({ ...prev, city: newCity }));
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const currentTotal = existingImages.length + newImages.length;
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

  const removeExistingImage = async (publicId) => {
    if (!confirm('Are you sure you want to delete this image permanently? This cannot be undone.')) return;
    try {
      await businessAPI.deleteImage(existingBusiness._id, publicId);
      setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
      toast.success('Image deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete image');
    }
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Payment receipt must be under 5MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WebP files are allowed.');
      return;
    }
    setPaymentReceiptFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPaymentReceiptPreview(previewUrl);
    if (errors.paymentReceipt) setErrors({ ...errors, paymentReceipt: '' });
  };

  const removeReceipt = () => {
    if (paymentReceiptPreview) URL.revokeObjectURL(paymentReceiptPreview);
    setPaymentReceiptFile(null);
    setPaymentReceiptPreview(null);
  };


  const validate = () => {
    const errs = {};
    if (!form.title.trim() || form.title.length < 2) errs.title = 'Business title is required (min 2 chars)';
    if (!form.description.trim() || form.description.length < 20) errs.description = 'Description must be at least 20 characters';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.country) errs.country = 'Country is required';
    if (!form.city.trim()) {
      errs.city = 'City is required';
    } else if (form.country && !isValidCity(form.country, form.city)) {
      errs.city = `Please select a valid city in ${form.country}`;
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!isEdit && paymentSettings?.isEnabled && !paymentReceiptFile) {
      errs.paymentReceipt = 'Payment screenshot is required to complete submission';
    }
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
      formData.append('address[country]', form.country);
      formData.append('address[city]', form.city.trim());
      if (form.street) formData.append('address[street]', form.street.trim());
      if (form.zipCode) formData.append('address[zipCode]', form.zipCode.trim());
      newImages.forEach((img) => formData.append('images', img));
      if (paymentReceiptFile) {
        formData.append('paymentReceipt', paymentReceiptFile);
      }

      if (isEdit) {
        if (isAdminEdit) {
          const updateData = {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            email: form.email ? form.email.toLowerCase() : '',
            phone: form.phone ? form.phone.trim() : '',
            website: form.website ? form.website.trim() : '',
            address: {
              country: form.country,
              city: form.city.trim(),
              street: form.street ? form.street.trim() : '',
              zipCode: form.zipCode ? form.zipCode.trim() : '',
            },
          };
          await adminAPI.adminUpdateBusiness(existingBusiness._id, updateData);
          toast.success('Business updated successfully.');
          if (onAdminSaved) {
            onAdminSaved();
          } else {
            router.push('/dashboard');
          }
        } else {
          await businessAPI.update(existingBusiness._id, formData);
          toast.success('Business updated. Pending re-approval.');
          router.push('/dashboard');
        }
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
          {isAdminEdit
            ? 'Admin Edit Mode: Core details will update directly without changing approval status or payment info.'
            : 'New listings require admin approval before becoming publicly visible. This usually takes up to 24 hours.'}
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
          Location & Address
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Country Dropdown */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label htmlFor="biz-country" className="form-label">
              Country <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id="biz-country"
              value={form.country}
              onChange={handleCountryChange}
              className={`select-field ${errors.country ? 'error' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.country}
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {errors.country}
              </p>
            )}
          </div>

          {/* City Dependent Searchable Combobox */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label htmlFor="biz-city" className="form-label">
              City <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <SearchableCombobox
              id="biz-city"
              value={form.city}
              onChange={handleCityChange}
              options={form.country ? getCities(form.country) : []}
              disabled={!form.country}
              placeholder="Search or select city..."
              disabledPlaceholder="Select country first"
              error={!!errors.city}
              emptyMessage="No city found"
              ariaLabel="Business City"
            />
            {errors.city && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {errors.city}
              </p>
            )}
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="biz-street" className="form-label">Street Address</label>
            <input
              id="biz-street"
              type="text"
              value={form.street}
              onChange={set('street')}
              placeholder="123 Main Street, Suite 100"
              className="input-field"
            />
          </div>

          {/* ZIP / Postal Code */}
          <div className="sm:col-span-1 lg:col-span-1">
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
        {isEdit && existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {existingImages.map((img, i) => (
              <div key={img.publicId} className="relative rounded-lg overflow-hidden" style={{ width: 72, height: 72, border: '2px solid #e5e7eb' }}>
                <Image src={img.url} alt={`Business image ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '0.6rem', color: '#fff' }}>Existing</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.publicId)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ background: '#dc2626', border: 'none', cursor: 'pointer', zIndex: 10 }}
                  aria-label="Delete existing image"
                >
                  <X size={10} color="#fff" />
                </button>
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
        {existingImages.length + newImages.length < MAX_IMAGES && (
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

      {/* Raast QR Code Payment Section (When Enabled by Admin) */}
      {!isEdit && paymentSettings?.isEnabled && (
        <section
          aria-label="Payment Information"
          className="p-5 sm:p-6 rounded-2xl relative overflow-hidden space-y-4 shadow-sm"
          style={{
            background: 'linear-gradient(145deg, #f0fdf4 0%, #e6f7ec 100%)',
            border: '2px solid #86efac',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b" style={{ borderColor: '#bbf7d0' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                style={{ background: '#16a34a' }}
              >
                <QrCode size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14532d' }}>
                    Raast QR Code Payment
                  </h3>
                  <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    Instant Transfer
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: '#166534' }}>
                  Scan with ANY Banking or Wallet App (EasyPaisa, JazzCash, SadaPay, HBL, Meezan, etc.)
                </p>
              </div>
            </div>
            <div
              className="px-3.5 py-1.5 rounded-full font-bold text-sm tracking-wide shadow-sm"
              style={{ background: '#16a34a', color: '#ffffff' }}
            >
              Fee: Rs. {paymentSettings.feeAmount}
            </div>
          </div>

          {/* Raast QR Code Display Card */}
          <div className="bg-white p-5 rounded-2xl border border-green-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
            {/* QR Code Graphic Frame */}
            {paymentSettings.qrCode?.url ? (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative p-3 bg-white rounded-2xl border-2 border-green-500 shadow-md">
                  {/* Scanner corner markers */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-green-600 rounded-tl"></div>
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-green-600 rounded-tr"></div>
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-green-600 rounded-bl"></div>
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-green-600 rounded-br"></div>
                  
                  <img
                    src={paymentSettings.qrCode.url}
                    alt="Raast Official Payment QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                  />
                </div>
                <a
                  href={paymentSettings.qrCode.url}
                  download="raast-payment-qr.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors mt-1"
                >
                  <Download size={13} /> Save QR to Gallery
                </a>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center p-3 border border-dashed border-gray-300 shrink-0">
                <QrCode size={44} className="text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Raast QR Code will appear here once uploaded by Admin.</p>
              </div>
            )}

            {/* Raast Payment Details & Step Instructions */}
            <div className="flex-1 space-y-3 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[0.7rem] font-bold text-emerald-800 uppercase tracking-wider block">
                    Account Title
                  </span>
                  <span className="text-sm font-bold text-gray-900 block mt-0.5">
                    {paymentSettings.accountTitle || 'BizPrimeHub'}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-[0.7rem] font-bold text-emerald-800 uppercase tracking-wider block">
                    Payment Gateway
                  </span>
                  <span className="text-sm font-bold text-gray-900 block mt-0.5">
                    {paymentSettings.bankName || 'Raast Instant Payment'}
                  </span>
                </div>
              </div>

              {paymentSettings.raastId && (
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[0.7rem] font-bold text-gray-500 uppercase tracking-wider block">
                      Raast ID (Optional)
                    </span>
                    <span className="text-sm font-bold text-gray-800 font-mono">
                      {paymentSettings.raastId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyRaastId(paymentSettings.raastId)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                  >
                    {copiedRaastId ? <Check size={12} /> : <Copy size={12} />}
                    {copiedRaastId ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              {/* Instructions steps */}
              <div className="text-xs text-emerald-950 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100 space-y-1 leading-relaxed">
                <p className="font-bold text-emerald-900 mb-1">📲 Payment Steps:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-emerald-800">
                  <li>Apni banking app (JazzCash, EasyPaisa, SadaPay, HBL, Meezan, etc.) open karein.</li>
                  <li><strong>&ldquo;Raast QR&rdquo; / &ldquo;Scan QR&rdquo;</strong> select kar ke yeh QR code scan karein (ya gallery se choose karein).</li>
                  <li>Amount <strong>Rs. {paymentSettings.feeAmount}</strong> verify kar ke transfer confirm karein.</li>
                  <li>Payment ka screenshot le kar neechay attach karein.</li>
                </ol>
              </div>
            </div>
          </div>

          {paymentSettings.instructions && (
            <p style={{ fontSize: '0.8125rem', color: '#7c2d12', lineHeight: 1.5, background: '#ffedd5', padding: '10px 14px', borderRadius: '10px' }}>
              💡 {paymentSettings.instructions}
            </p>
          )}

          {/* Screenshot Upload Input */}
          <div className="space-y-2 pt-1">
            <label htmlFor="payment-receipt" className="form-label" style={{ color: '#9a3412', fontWeight: 600 }}>
              Upload Payment Screenshot <span style={{ color: '#dc2626' }}>*</span>
            </label>

            {paymentReceiptPreview ? (
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#ffffff', border: '2px solid #bbf7d0' }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative rounded-lg overflow-hidden flex-shrink-0" style={{ width: 56, height: 56, border: '1px solid #e5e7eb' }}>
                    <Image src={paymentReceiptPreview} alt="Payment receipt screenshot" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5" style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>
                      <FileCheck size={16} /> Screenshot Attached
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {paymentReceiptFile?.name} ({(paymentReceiptFile?.size / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
                  style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                  aria-label="Remove payment receipt"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="payment-receipt"
                className={`flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all ${
                  errors.paymentReceipt ? 'border-red-400 bg-red-50' : 'hover:border-amber-400 hover:bg-amber-50/50'
                }`}
                style={{
                  border: errors.paymentReceipt ? '2px dashed #f87171' : '2px dashed #fbbf24',
                  background: '#ffffff',
                }}
              >
                <Upload size={22} style={{ color: '#d97706', marginBottom: 4 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9a3412' }}>
                  Click to upload payment screenshot
                </span>
                <span style={{ fontSize: '0.75rem', color: '#78716c', marginTop: 2 }}>
                  JPG, PNG, or WebP up to 5MB
                </span>
                <input
                  id="payment-receipt"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReceiptSelect}
                  className="sr-only"
                  aria-label="Upload payment screenshot"
                  aria-required="true"
                  required={!isEdit && paymentSettings?.isEnabled}
                />
              </label>
            )}

            {errors.paymentReceipt && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                {errors.paymentReceipt}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            if (onCancel) onCancel();
            else router.back();
          }}
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

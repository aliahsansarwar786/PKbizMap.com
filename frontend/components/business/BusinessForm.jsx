'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI, settingsAPI, adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Upload,
  X,
  AlertCircle,
  Copy,
  Check,
  FileCheck,
  QrCode,
  Download,
  Building2,
  MapPin,
  Image as ImageIcon,
  Clock,
  Globe,
  Share2,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Calendar,
  Sparkles,
  CreditCard,
  Smartphone,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_OPENING_HOURS = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '18:00', closed: false },
  sunday: { open: '09:00', close: '18:00', closed: true },
};

const MAX_IMAGES = 5;

// WhatsApp SVG Icon
function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

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
    // Section 1: Business Identity
    title: existingBusiness?.title || '',
    contactPerson: existingBusiness?.contactPerson || '',
    email: existingBusiness?.email || '',
    phone: existingBusiness?.phone || '',
    whatsapp: existingBusiness?.whatsapp || '',

    // Section 2: Location & Category
    country: existingBusiness?.address?.country || 'Pakistan',
    city: existingBusiness?.address?.city || '',
    area: existingBusiness?.address?.area || '',
    zipCode: existingBusiness?.address?.zipCode || '',
    category: existingBusiness?.category || '',
    subcategory: existingBusiness?.subcategory || '',
    street: existingBusiness?.address?.street || '',

    // Section 3: Content & Media
    description: existingBusiness?.description || '',

    // Section 5: Online Links
    website: existingBusiness?.website || '',
    facebook: existingBusiness?.socialLinks?.facebook || '',
    youtube: existingBusiness?.socialLinks?.youtube || '',
    googleBusiness: existingBusiness?.socialLinks?.googleBusiness || '',
  });

  // Section 4: Opening Hours
  const [openingHours, setOpeningHours] = useState(() => {
    if (existingBusiness?.openingHours && typeof existingBusiness.openingHours === 'object') {
      const merged = { ...DEFAULT_OPENING_HOURS };
      DAYS_OF_WEEK.forEach(({ key }) => {
        if (existingBusiness.openingHours[key]) {
          merged[key] = {
            open: existingBusiness.openingHours[key].open || '09:00',
            close: existingBusiness.openingHours[key].close || '18:00',
            closed: Boolean(existingBusiness.openingHours[key].closed),
          };
        }
      });
      return merged;
    }
    return DEFAULT_OPENING_HOURS;
  });

  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(existingBusiness?.images || []);

  const [paymentSettings, setPaymentSettings] = useState(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptPreview, setPaymentReceiptPreview] = useState(null);
  const [copiedRaastId, setCopiedRaastId] = useState(false);
  const [copiedMethodId, setCopiedMethodId] = useState(null);
  const [copiedDetails, setCopiedDetails] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  // Load public payment settings
  useEffect(() => {
    if (!isEdit) {
      settingsAPI.getPayment()
        .then((res) => setPaymentSettings(res.data?.settings || null))
        .catch(() => {});
    }
  }, [isEdit]);

  // Populate data when editing existing business
  useEffect(() => {
    if (existingBusiness) {
      setForm({
        title: existingBusiness.title || '',
        contactPerson: existingBusiness.contactPerson || '',
        email: existingBusiness.email || '',
        phone: existingBusiness.phone || '',
        whatsapp: existingBusiness.whatsapp || '',
        country: existingBusiness.address?.country || 'Pakistan',
        city: existingBusiness.address?.city || '',
        area: existingBusiness.address?.area || '',
        zipCode: existingBusiness.address?.zipCode || '',
        category: existingBusiness.category || '',
        subcategory: existingBusiness.subcategory || '',
        street: existingBusiness.address?.street || '',
        description: existingBusiness.description || '',
        website: existingBusiness.website || '',
        facebook: existingBusiness.socialLinks?.facebook || '',
        youtube: existingBusiness.socialLinks?.youtube || '',
        googleBusiness: existingBusiness.socialLinks?.googleBusiness || '',
      });

      if (existingBusiness.openingHours && typeof existingBusiness.openingHours === 'object') {
        const merged = { ...DEFAULT_OPENING_HOURS };
        DAYS_OF_WEEK.forEach(({ key }) => {
          if (existingBusiness.openingHours[key]) {
            merged[key] = {
              open: existingBusiness.openingHours[key].open || '09:00',
              close: existingBusiness.openingHours[key].close || '18:00',
              closed: Boolean(existingBusiness.openingHours[key].closed),
            };
          }
        });
        setOpeningHours(merged);
      }

      setExistingImages(existingBusiness.images || []);
    }
  }, [existingBusiness]);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setForm((prev) => ({
      ...prev,
      country: newCountry,
      city: '',
    }));
    if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  const handleCityChange = (newCity) => {
    setForm((prev) => ({ ...prev, city: newCity }));
    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
  };

  // Opening hours handlers
  const handleToggleClosed = (dayKey) => {
    setOpeningHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        closed: !prev[dayKey].closed,
      },
    }));
  };

  const handleTimeChange = (dayKey, field, val) => {
    setOpeningHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: val,
      },
    }));
  };

  const applyDefaultHours = () => {
    setOpeningHours(DEFAULT_OPENING_HOURS);
    toast.success('Applied standard business hours (Mon-Sat 9AM-6PM, Sun Closed)');
  };

  const apply24SevenHours = () => {
    const allOpen = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      allOpen[key] = { open: '00:00', close: '23:59', closed: false };
    });
    setOpeningHours(allOpen);
    toast.success('Applied 24/7 Open schedule');
  };

  // Image Upload Handlers
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
    if (errors.images) setErrors((prev) => ({ ...prev, images: '' }));
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

  // Receipt Select Handlers
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

  const handleCopyRaastId = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    setCopiedRaastId(true);
    toast.success('Raast ID copied to clipboard!');
    setTimeout(() => setCopiedRaastId(false), 2500);
  };

  const handleCopyMethodValue = (methodId, text, methodName, kind) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    setCopiedMethodId(methodId);
    toast.success(`${methodName || 'Account'} ${kind === 'iban' ? 'IBAN' : 'number'} copied to clipboard!`);
    setTimeout(() => setCopiedMethodId(null), 2500);
  };

  const handleCopyDetails = () => {
    const title = paymentSettings?.accountTitle || 'BizPrimeHub';
    const num = paymentSettings?.raastId || paymentSettings?.accountNumber || '';
    const textToCopy = `Account Title: ${title}\nAccount Number: ${num}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedDetails(true);
    toast.success('Account details copied to clipboard!');
    setTimeout(() => setCopiedDetails(false), 2500);
  };

  // URL Validator Helper
  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true;
    try {
      const toTest = url.trim().startsWith('http://') || url.trim().startsWith('https://')
        ? url.trim()
        : `https://${url.trim()}`;
      new URL(toTest);
      return true;
    } catch {
      return false;
    }
  };

  // Validation according to specifications
  const validate = () => {
    const errs = {};

    // Section 1: Business Identity
    if (!form.title.trim() || form.title.length < 2) {
      errs.title = 'Business Name is required (min 2 characters)';
    }
    if (!form.contactPerson.trim()) {
      errs.contactPerson = 'Contact Person Name is required';
    }
    if (!form.email.trim()) {
      errs.email = 'Business Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Please provide a valid email address';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone Number is required';
    } else if (!/^[+\d\s\-().]{7,25}$/.test(form.phone.trim())) {
      errs.phone = 'Please provide a valid phone number';
    }
    if (!form.whatsapp.trim()) {
      errs.whatsapp = 'WhatsApp Number is required';
    } else if (!/^[+\d\s\-().]{7,25}$/.test(form.whatsapp.trim())) {
      errs.whatsapp = 'Please provide a valid WhatsApp number';
    }

    // Section 2: Location & Category
    if (!form.country) {
      errs.country = 'Country is required';
    }
    if (!form.city.trim()) {
      errs.city = 'City is required';
    } else if (form.country && !isValidCity(form.country, form.city)) {
      errs.city = `Please select a valid city in ${form.country}`;
    }
    if (!form.category) {
      errs.category = 'Category is required';
    }
    if (!form.street.trim()) {
      errs.street = 'Complete Address is required';
    }

    // Section 3: Content & Media
    if (!form.description.trim() || form.description.length < 20) {
      errs.description = 'Description must be at least 20 characters';
    }
    const totalImages = existingImages.length + newImages.length;
    if (!isEdit && totalImages === 0) {
      errs.images = 'Business Logo is required';
    }

    // Section 5: Online Links
    if (form.website && !isValidUrl(form.website)) {
      errs.website = 'Please provide a valid website URL';
    }
    if (form.facebook && !isValidUrl(form.facebook)) {
      errs.facebook = 'Please provide a valid Facebook URL';
    }
    if (form.youtube && !isValidUrl(form.youtube)) {
      errs.youtube = 'Please provide a valid YouTube URL';
    }
    if (form.googleBusiness && !isValidUrl(form.googleBusiness)) {
      errs.googleBusiness = 'Please provide a valid Google Business profile URL';
    }

    // Section 6: Payment (When enabled)
    if (!isEdit && paymentSettings?.isEnabled && !paymentReceiptFile) {
      errs.paymentReceipt = 'Payment screenshot is required to complete submission';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fix the errors marked in red before submitting.');
      // Scroll to the first error
      const firstErrorEl = document.querySelector('[aria-invalid="true"]');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      const socialLinksData = {
        facebook: form.facebook.trim(),
        youtube: form.youtube.trim(),
        googleBusiness: form.googleBusiness.trim(),
      };

      if (isEdit && isAdminEdit) {
        // Admin direct edit mode (JSON payload)
        const updateData = {
          title: form.title.trim(),
          contactPerson: form.contactPerson.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
          category: form.category,
          subcategory: form.subcategory.trim(),
          description: form.description.trim(),
          website: form.website.trim(),
          socialLinks: socialLinksData,
          openingHours,
          address: {
            country: form.country,
            city: form.city.trim(),
            street: form.street.trim(),
            area: form.area.trim(),
            zipCode: form.zipCode.trim(),
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
        // Standard user submission (FormData for file uploads)
        const formData = new FormData();
        formData.append('title', form.title.trim());
        formData.append('contactPerson', form.contactPerson.trim());
        formData.append('email', form.email.trim().toLowerCase());
        formData.append('phone', form.phone.trim());
        formData.append('whatsapp', form.whatsapp.trim());
        formData.append('category', form.category);
        if (form.subcategory.trim()) formData.append('subcategory', form.subcategory.trim());
        formData.append('description', form.description.trim());

        if (form.website.trim()) formData.append('website', form.website.trim());
        formData.append('socialLinks', JSON.stringify(socialLinksData));
        formData.append('openingHours', JSON.stringify(openingHours));

        formData.append('address[country]', form.country);
        formData.append('address[city]', form.city.trim());
        formData.append('address[street]', form.street.trim());
        if (form.area.trim()) formData.append('address[area]', form.area.trim());
        if (form.zipCode.trim()) formData.append('address[zipCode]', form.zipCode.trim());

        newImages.forEach((img) => formData.append('images', img));
        if (paymentReceiptFile) {
          formData.append('paymentReceipt', paymentReceiptFile);
        }

        if (isEdit) {
          await businessAPI.update(existingBusiness._id, formData);
          toast.success('Business updated. Pending re-approval.');
          router.push('/dashboard');
        } else {
          await businessAPI.create(formData);
          toast.success('Business submitted! Pending admin approval.');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto" noValidate>
      {/* Admin or User Notification Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 shadow-xs">
        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">
            {isAdminEdit ? 'Admin Edit Mode' : 'Verification & Quality Review'}
          </p>
          <p className="text-xs text-amber-800/90 mt-0.5">
            {isAdminEdit
              ? 'Core business details will update directly without interrupting existing verification.'
              : 'All listings are reviewed by our administration team before being publicly indexed. Please provide accurate contact and location details.'}
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1 — BUSINESS IDENTITY
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Business Identity"
        className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Section 1
              </span>
              <h2 className="text-lg font-bold text-gray-900">Business Identity</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Official business details and primary contact channels
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Business Name */}
          <div className="sm:col-span-2">
            <label htmlFor="biz-title" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="biz-title"
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Skyline Logistics & Courier Services"
              className={`w-full h-11 px-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                errors.title
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
              }`}
              maxLength={100}
              aria-required="true"
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.title}</p>}
          </div>

          {/* Contact Person Name */}
          <div>
            <label htmlFor="biz-contactPerson" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Contact Person Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="biz-contactPerson"
                type="text"
                value={form.contactPerson}
                onChange={set('contactPerson')}
                placeholder="e.g. Ahsan Ali"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.contactPerson
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                }`}
                maxLength={100}
                aria-required="true"
                aria-invalid={!!errors.contactPerson}
              />
            </div>
            {errors.contactPerson && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.contactPerson}</p>}
          </div>

          {/* Business Email */}
          <div>
            <label htmlFor="biz-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Business Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="biz-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="e.g. contact@yourbusiness.com"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                }`}
                aria-required="true"
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="biz-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="biz-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. +92 300 1234567"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.phone
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                }`}
                aria-required="true"
                aria-invalid={!!errors.phone}
              />
            </div>
            {errors.phone && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.phone}</p>}
          </div>

          {/* WhatsApp Number */}
          <div>
            <label htmlFor="biz-whatsapp" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              WhatsApp Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <WhatsAppIcon size={16} />
              </div>
              <input
                id="biz-whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="e.g. +92 310 6131361"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.whatsapp
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-gray-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                aria-required="true"
                aria-invalid={!!errors.whatsapp}
              />
            </div>
            {errors.whatsapp && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.whatsapp}</p>}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2 — LOCATION & CATEGORY
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Location and Category"
        className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Section 2
              </span>
              <h2 className="text-lg font-bold text-gray-900">Location & Category</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Specify your regional location, industry category, and address
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Country Dropdown */}
          <div>
            <label htmlFor="biz-country" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Country <span className="text-rose-500">*</span>
            </label>
            <select
              id="biz-country"
              value={form.country}
              onChange={handleCountryChange}
              className={`w-full h-11 px-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all cursor-pointer ${
                errors.country
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
              }`}
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
            {errors.country && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.country}</p>}
          </div>

          {/* City Searchable Combobox */}
          <div>
            <label htmlFor="biz-city" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              City <span className="text-rose-500">*</span>
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
            {errors.city && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.city}</p>}
          </div>

          {/* Area / Neighbourhood (Optional) */}
          <div>
            <label htmlFor="biz-area" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Area / Neighbourhood</span>
              <span className="text-[11px] font-normal text-gray-400 lowercase">optional</span>
            </label>
            <input
              id="biz-area"
              type="text"
              value={form.area}
              onChange={set('area')}
              placeholder="e.g. DHA Phase 5 / Gulberg III"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="biz-category" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="biz-category"
              value={form.category}
              onChange={set('category')}
              className={`w-full h-11 px-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all cursor-pointer ${
                errors.category
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
              }`}
              aria-required="true"
              aria-invalid={!!errors.category}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.category}</p>}
          </div>

          {/* Subcategory (Optional) */}
          <div>
            <label htmlFor="biz-subcategory" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Subcategory</span>
              <span className="text-[11px] font-normal text-gray-400 lowercase">optional</span>
            </label>
            <input
              id="biz-subcategory"
              type="text"
              value={form.subcategory}
              onChange={set('subcategory')}
              placeholder="e.g. Software House / Fast Food"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Postal / ZIP Code */}
          <div>
            <label htmlFor="biz-zip" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Postal / ZIP Code</span>
              <span className="text-[11px] font-normal text-gray-400 lowercase">optional</span>
            </label>
            <input
              id="biz-zip"
              type="text"
              value={form.zipCode}
              onChange={set('zipCode')}
              placeholder="e.g. 54000"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              maxLength={20}
            />
          </div>

          {/* Complete Street Address */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="biz-street" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Complete Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="biz-street"
              type="text"
              value={form.street}
              onChange={set('street')}
              placeholder="e.g. Office # 402, 4th Floor, Arfa Software Technology Park, Ferozepur Road"
              className={`w-full h-11 px-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                errors.street
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
              }`}
              aria-required="true"
              aria-invalid={!!errors.street}
            />
            {errors.street && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.street}</p>}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3 — CONTENT & MEDIA
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Content and Media"
        className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ImageIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                Section 3
              </span>
              <h2 className="text-lg font-bold text-gray-900">Content & Media</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload your official business logo and write a compelling description
            </p>
          </div>
        </div>

        {/* Business Logo & Images */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Business Logo <span className="text-rose-500">*</span>{' '}
            <span className="text-[11px] font-normal text-gray-500 lowercase">(max 5MB, JPG/PNG/WebP)</span>
          </label>

          {/* Existing Images in edit mode */}
          {isEdit && existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-2">
              {existingImages.map((img, i) => (
                <div key={img.publicId} className="relative rounded-xl overflow-hidden w-20 h-20 border-2 border-gray-200 shadow-xs">
                  <Image src={img.url} alt={`Business media ${i + 1}`} fill className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 text-[10px] text-white text-center font-semibold">
                    {i === 0 ? 'Logo' : 'Image'}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.publicId)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                    aria-label="Delete image"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Image Previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden w-20 h-20 border-2 border-blue-400 shadow-xs">
                  <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 py-0.5 bg-blue-600/80 text-[10px] text-white text-center font-semibold">
                    {existingImages.length === 0 && i === 0 ? 'Logo' : 'New'}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                    aria-label={`Remove new image ${i + 1}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {existingImages.length + newImages.length < MAX_IMAGES && (
            <label
              htmlFor="biz-logo-upload"
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                errors.images
                  ? 'border-rose-400 bg-rose-50/40 hover:bg-rose-50/70'
                  : 'border-gray-300 hover:border-blue-500 bg-gray-50/50 hover:bg-blue-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Upload size={22} />
              </div>
              <span className="text-sm font-semibold text-gray-800">
                Click to upload your Business Logo
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Supports JPG, PNG, WebP up to 5MB (Up to {MAX_IMAGES - existingImages.length - newImages.length} images remaining)
              </span>
              <input
                id="biz-logo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="sr-only"
                aria-label="Upload business logo"
              />
            </label>
          )}

          {errors.images && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.images}</p>}
        </div>

        {/* Business Description */}
        <div>
          <label htmlFor="biz-description" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Business Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="biz-description"
            value={form.description}
            onChange={set('description')}
            placeholder="Describe your business services, products, background, and what makes your business unique... (min 20 characters)"
            rows={5}
            className={`w-full p-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all leading-relaxed ${
              errors.description
                ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20'
                : 'border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
            }`}
            maxLength={2000}
            aria-required="true"
            aria-invalid={!!errors.description}
          />
          <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
            {errors.description ? (
              <span className="text-rose-600 font-medium">{errors.description}</span>
            ) : (
              <span>Minimum 20 characters required</span>
            )}
            <span className="font-mono">{form.description.length}/2000</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4 — WEEKLY OPENING HOURS (NEW, Optional)
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Weekly Opening Hours"
        className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Section 4
                </span>
                <h2 className="text-lg font-bold text-gray-900">Weekly Opening Hours</h2>
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Set opening and closing times for each day of the week
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyDefaultHours}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Standard (Mon-Sat 9AM-6PM)
            </button>
            <button
              type="button"
              onClick={apply24SevenHours}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              24/7 Open
            </button>
          </div>
        </div>

        {/* 7 Days Table / Rows */}
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const dayData = openingHours[key] || { open: '09:00', close: '18:00', closed: false };
            const isClosed = Boolean(dayData.closed);

            return (
              <div
                key={key}
                className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isClosed ? 'bg-gray-50/50' : 'bg-white'
                }`}
              >
                {/* Day name & toggle badge */}
                <div className="flex items-center justify-between sm:justify-start gap-4 sm:w-44">
                  <span className={`text-sm font-bold ${isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleClosed(key)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      isClosed
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {isClosed ? 'Closed' : 'Open'}
                  </button>
                </div>

                {/* Time Pickers or Closed indicator */}
                <div className="flex items-center gap-3">
                  {isClosed ? (
                    <span className="text-xs font-medium text-gray-400 italic py-1.5">
                      Closed all day
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">From:</span>
                        <input
                          type="time"
                          value={dayData.open}
                          onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-xs font-semibold text-gray-800 outline-none focus:border-blue-600"
                        />
                      </div>
                      <span className="text-gray-400 font-bold">—</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">To:</span>
                        <input
                          type="time"
                          value={dayData.close}
                          onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-gray-200 bg-gray-50/60 text-xs font-semibold text-gray-800 outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5 — ONLINE LINKS (Optional)
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Online Links"
        className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6 sm:p-7 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Section 5
              </span>
              <h2 className="text-lg font-bold text-gray-900">Online Links</h2>
              <span className="text-xs text-gray-400 font-normal">(All Optional)</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect your website, social media pages, and Google Business Profile
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Website */}
          <div>
            <label htmlFor="biz-website" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Official Website
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="biz-website"
                type="url"
                value={form.website}
                onChange={set('website')}
                placeholder="https://yourbusiness.com"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.website ? 'border-rose-400' : 'border-gray-200 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.website && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.website}</p>}
          </div>

          {/* Facebook Page URL */}
          <div>
            <label htmlFor="biz-facebook" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Facebook Page URL
            </label>
            <div className="relative">
              <Share2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
              <input
                id="biz-facebook"
                type="url"
                value={form.facebook}
                onChange={set('facebook')}
                placeholder="https://facebook.com/yourbusiness"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.facebook ? 'border-rose-400' : 'border-gray-200 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.facebook && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.facebook}</p>}
          </div>

          {/* YouTube Channel URL */}
          <div>
            <label htmlFor="biz-youtube" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              YouTube Channel URL
            </label>
            <div className="relative">
              <Share2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-600 pointer-events-none" />
              <input
                id="biz-youtube"
                type="url"
                value={form.youtube}
                onChange={set('youtube')}
                placeholder="https://youtube.com/@yourbusiness"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.youtube ? 'border-rose-400' : 'border-gray-200 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.youtube && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.youtube}</p>}
          </div>

          {/* Google Business Profile URL */}
          <div>
            <label htmlFor="biz-googleBusiness" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Google Business Profile URL
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
              <input
                id="biz-googleBusiness"
                type="url"
                value={form.googleBusiness}
                onChange={set('googleBusiness')}
                placeholder="https://maps.app.goo.gl/... or business profile link"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border bg-gray-50/60 focus:bg-white text-sm text-gray-900 outline-none transition-all ${
                  errors.googleBusiness ? 'border-rose-400' : 'border-gray-200 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.googleBusiness && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.googleBusiness}</p>}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6 — LISTING CHARGES (Only when Payment is ON)
          Card Title strictly: "Listing Charges"
      ───────────────────────────────────────────────────────────── */}
      {!isEdit && paymentSettings?.isEnabled && (
        <section
          aria-label="Listing Charges"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-7 space-y-6 relative overflow-hidden"
        >
          {/* 1. HEADER ROW: left — green QR icon + light-green "SECTION 6" pill + bold "Listing Charges"; neeche subtitle. Right — green pill "Fee: Rs. {feeAmount}" */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <QrCode size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Section 6
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">Listing Charges</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete the transfer using either payment option below and upload screenshot.
                </p>
              </div>
            </div>

            <div className="px-4 py-1.5 rounded-full font-extrabold text-sm tracking-wide bg-emerald-600 text-white shadow-sm shrink-0">
              Fee: Rs. {paymentSettings.feeAmount}
            </div>
          </div>

          {/* 2. TWO COLUMNS (desktop; mobile par stack) */}
          {(() => {
            const enabledMethods = (paymentSettings.paymentMethods || []).filter((m) => m.isEnabled);
            const hasMethods = enabledMethods.length > 0;

            return (
              <div className={`grid grid-cols-1 ${hasMethods ? 'lg:grid-cols-2' : ''} gap-6 items-start`}>
                {/* LEFT — "Raast QR Payment" white card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    {/* Green dot + bold title + light-green pill "Any Banking App" (phone icon) */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">Raast QR Payment</h3>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        <Smartphone size={12} />
                        <span>Any Banking App</span>
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="text-xs text-gray-500 mt-2">
                      Scan the QR code or use the account details below to make your payment.
                    </p>

                    {/* QR Code + Account fields */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 mt-4">
                      {/* QR image light-green box */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shrink-0 w-full sm:w-44">
                        {paymentSettings.qrCode?.url ? (
                          <>
                            <div className="p-1.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                              <img
                                src={paymentSettings.qrCode.url}
                                alt="Raast Payment QR Code"
                                className="w-32 h-32 object-contain rounded"
                              />
                            </div>
                            <a
                              href={paymentSettings.qrCode.url}
                              download="raast-payment-qr.png"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors mt-1.5"
                            >
                              <Download size={11} /> Save QR
                            </a>
                          </>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-white flex flex-col items-center justify-center p-2 border border-dashed border-gray-300 text-center">
                            <QrCode size={28} className="text-gray-400 mb-1" />
                            <p className="text-[10px] text-gray-400 font-medium">QR Code</p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 mt-2">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Scan to Pay</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5 max-w-[150px]">
                          Use any banking app (JazzCash, EasyPaisa, HBL, Meezan, etc.)
                        </p>
                      </div>

                      {/* Side me "Account Title" field (person icon) + "Account Number" field (card icon) + green "Copy Details" button */}
                      <div className="flex-1 flex flex-col justify-between gap-2.5 w-full">
                        <div className="p-2.5 bg-gray-50/90 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                            <User size={13} className="text-emerald-600 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Account Title
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate">
                            {paymentSettings.accountTitle || 'BizPrimeHub'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-gray-50/90 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
                            <CreditCard size={13} className="text-emerald-600 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Account Number
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold font-mono text-gray-900 block truncate">
                            {paymentSettings.raastId || paymentSettings.accountNumber || '—'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyDetails}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer mt-auto"
                        >
                          {copiedDetails ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedDetails ? 'Details Copied!' : 'Copy Details'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Neeche light-blue "Important Instructions" box, 3 numbered points */}
                  <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                      <AlertCircle size={14} className="text-blue-600 shrink-0" />
                      <span>Important Instructions</span>
                    </div>
                    <ol className="space-y-1.5 text-xs text-blue-950 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Enter the exact amount (Rs. {paymentSettings.feeAmount}) in your banking app.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Use the given Account Title and Account Number.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Keep the payment screenshot for upload below.</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* RIGHT — payment method cards (paymentMethods se DYNAMIC list — hardcode mat karna) */}
                {hasMethods && (
                  <div className="space-y-4">
                    {enabledMethods.map((method) => {
                      const isCopied = copiedMethodId === method._id;
                      const isIban = method.kind === 'iban';

                      return (
                        <div
                          key={method._id}
                          className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-md border border-black/15 group select-none transition-transform hover:-translate-y-0.5"
                        >
                          {/* Blank background card image uploaded by admin */}
                          {method.cardImage?.url ? (
                            <img
                              src={method.cardImage.url}
                              alt={method.name}
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 pointer-events-none" />
                          )}

                          {/* Subtle dark gradient overlay for optimal legibility across any artwork */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/35 pointer-events-none" />

                          {/* Overlaid details */}
                          <div className="absolute inset-0 p-[5%] sm:p-5 flex flex-col justify-between text-white z-10">
                            {/* Top Row: top-right pill "ACCOUNT NO." or "IBAN" */}
                            <div className="flex items-center justify-end">
                              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/25 text-white shadow-sm">
                                {isIban ? 'IBAN' : 'ACCOUNT NO.'}
                              </span>
                            </div>

                            {/* Middle: ACCOUNT TITLE + ACCOUNT NUMBER/IBAN with visible Copy button */}
                            <div className="my-auto space-y-1.5">
                              <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-white/75 uppercase tracking-wider block">
                                  ACCOUNT TITLE
                                </span>
                                <span className="font-bold text-amber-300 text-xs sm:text-sm md:text-base drop-shadow block truncate">
                                  {method.accountTitle}
                                </span>
                              </div>

                              <div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-white/75 uppercase tracking-wider block">
                                  {isIban ? 'IBAN' : 'ACCOUNT NUMBER'}
                                </span>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <span className="font-mono font-black text-sm sm:text-base md:text-lg tracking-wider text-white drop-shadow select-all break-all">
                                    {method.accountValue}
                                  </span>

                                  {/* Visible Copy button */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMethodValue(method._id, method.accountValue, method.name, method.kind)}
                                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border cursor-pointer ${
                                      isCopied
                                        ? 'bg-emerald-600 text-white border-emerald-400'
                                        : 'bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border-white/30'
                                    }`}
                                    title={`Copy ${method.name} ${isIban ? 'IBAN' : 'number'}`}
                                  >
                                    {isCopied ? <Check size={12} className="text-white" /> : <Copy size={12} />}
                                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Row: bottom-right method ka name */}
                            <div className="flex items-end justify-between gap-2 pt-1.5 border-t border-white/20">
                              {method.details ? (
                                <span className="text-[10px] sm:text-[11px] text-white/80 font-medium truncate max-w-[60%]" title={method.details}>
                                  {method.details}
                                </span>
                              ) : (
                                <span className="text-[10px] text-white/70 font-medium">
                                  Fee: Rs. {paymentSettings.feeAmount}
                                </span>
                              )}
                              <span className="font-black text-xs sm:text-sm md:text-base tracking-wide text-white drop-shadow ml-auto uppercase">
                                {method.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Optional instructions note if specified */}
          {paymentSettings.instructions && (
            <p className="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200/80">
              💡 {paymentSettings.instructions}
            </p>
          )}

          {/* 3. YELLOW BANNER (shield icon, dynamic text) */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center gap-3 text-amber-900 shadow-2xs">
            <ShieldCheck size={20} className="text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              Send the exact fee (Rs. {paymentSettings.feeAmount}) using any payment option above and attach the payment receipt screenshot.
            </p>
          </div>

          {/* 4. UPLOAD BOX: dashed green border, cloud-upload icon, bold title + right side green Click to Upload button */}
          <div className="space-y-2">
            {paymentReceiptPreview ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative rounded-lg overflow-hidden w-14 h-14 border border-emerald-400 shrink-0">
                    <Image src={paymentReceiptPreview} alt="Payment receipt screenshot" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                      <FileCheck size={16} /> Screenshot Attached
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {paymentReceiptFile?.name} ({(paymentReceiptFile?.size / 1024).toFixed(0)} KB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Remove payment receipt"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="payment-receipt"
                className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  errors.paymentReceipt
                    ? 'border-rose-400 bg-rose-50/40'
                    : 'border-emerald-400 hover:border-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">
                      Upload Payment Screenshot <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      (JPG, PNG, or WebP up to 5MB)
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 shrink-0 transition-colors pointer-events-none">
                  <Upload size={14} />
                  <span>Click to Upload</span>
                </div>

                <input
                  id="payment-receipt"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleReceiptSelect}
                  className="sr-only"
                  aria-label="Upload payment screenshot"
                  aria-required="true"
                />
              </label>
            )}

            {errors.paymentReceipt && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.paymentReceipt}</p>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FLOW: Bottom Action Buttons (Cancel + Submit)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-3">
        <button
          type="button"
          onClick={() => {
            if (onCancel) onCancel();
            else router.back();
          }}
          className="w-full sm:w-1/3 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading && <span className="spinner" />}
          <span>
            {loading
              ? isEdit
                ? 'Updating Business...'
                : 'Submitting...'
              : isEdit
              ? 'Update Business Details'
              : 'Submit Business for Approval'}
          </span>
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, Building2, Clock, CheckCircle2, Star,
  Check, X, Trash2, ChevronLeft, ChevronRight, Shield, Edit3,
  CreditCard, Eye, Image as ImageIcon, Save, ExternalLink,
  DollarSign, CheckCircle, AlertCircle, Phone, ArrowUpRight,
  QrCode, Upload, MessageSquare, Search, Filter, Plus, Mail, Bell,
  ArrowLeft, AlertTriangle
} from 'lucide-react';
import BusinessForm from '@/components/business/BusinessForm';

function StatCard({ label, value, icon: Icon, color = '#2563eb' }) {
  return (
    <div className="card p-3.5 sm:p-5">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-xs sm:text-[0.8125rem] font-medium text-gray-500 truncate mr-1">{label}</p>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon size={16} className="sm:hidden" style={{ color }} />
          <Icon size={18} className="hidden sm:block" style={{ color }} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-gray-800 tracking-tight">{value ?? '—'}</p>
    </div>
  );
}

const normalizePaymentConfig = (s) => {
  if (!s) return null;
  const legacyPakistanFee = s.fees?.Pakistan?.amount ?? s.feeAmount ?? 50;
  return {
    ...s,
    ownerNotificationEmail: s.ownerNotificationEmail ?? 'ahsanalisarwar555@gmail.com',
    ownerNotificationsEnabled: s.ownerNotificationsEnabled !== false,
    feeAmount: legacyPakistanFee,
    fees: {
      Pakistan: {
        amount: Number(s.fees?.Pakistan?.amount ?? legacyPakistanFee) || 0,
        currency: 'PKR',
        symbol: 'Rs.',
      },
      UAE: {
        amount: Number(s.fees?.UAE?.amount ?? 0) || 0,
        currency: 'AED',
        symbol: 'AED ',
      },
      USA: {
        amount: Number(s.fees?.USA?.amount ?? 0) || 0,
        currency: 'USD',
        symbol: '$',
      },
    },
    qrEnabled: s.qrEnabled !== false,
    qrCountries: Array.isArray(s.qrCountries) && s.qrCountries.length > 0 ? s.qrCountries : ['Pakistan'],
    paymentMethods: Array.isArray(s.paymentMethods)
      ? s.paymentMethods.map((m) => ({
          ...m,
          countries: Array.isArray(m.countries) && m.countries.length > 0 ? m.countries : ['Pakistan'],
        }))
      : [],
  };
};

const TAB_META = {
  pending: {
    icon: Clock,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    desc: 'Review submissions',
  },
  'all-businesses': {
    icon: Building2,
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    desc: 'Directory listings',
  },
  payments: {
    icon: CreditCard,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    desc: 'Verify receipts',
  },
  reviews: {
    icon: Star,
    color: '#db2777',
    bgColor: '#fdf2f8',
    borderColor: '#fbcfe8',
    desc: 'Moderate reviews',
  },
  users: {
    icon: Users,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    desc: 'Accounts & roles',
  },
  'payment-settings': {
    icon: QrCode,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    desc: 'Raast QR & cards',
  },
};

export default function AdminDashboardClient() {
  const { user, isAuthenticated, isAdmin, hasAdminAccess, loading: authLoading } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'subadmin';
  const perms = useMemo(() => {
    return {
      canApproveListings: Boolean(user?.permissions?.canApproveListings),
      canDeleteListings: Boolean(user?.permissions?.canDeleteListings),
      canModerateReviews: Boolean(user?.permissions?.canModerateReviews),
    };
  }, [user?.permissions]);

  const [tab, setTab] = useState('pending');
  const [mobileActive, setMobileActive] = useState(false);
  const [dashStats, setDashStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Raast QR Payment Gateway Settings & Payment Methods
  const [paymentConfig, setPaymentConfig] = useState({
    isEnabled: false,
    ownerNotificationEmail: 'ahsanalisarwar555@gmail.com',
    ownerNotificationsEnabled: true,
    feeAmount: 50,
    fees: {
      Pakistan: { amount: 50, currency: 'PKR', symbol: 'Rs.' },
      UAE: { amount: 0, currency: 'AED', symbol: 'AED ' },
      USA: { amount: 0, currency: 'USD', symbol: '$' },
    },
    qrEnabled: true,
    qrCountries: ['Pakistan'],
    qrCode: { url: '', publicId: '' },
    raastId: '',
    accountTitle: 'BizPrimeHub',
    bankName: 'Raast Instant Payment',
    instructions: 'Scan this Raast QR code with any banking or wallet app (JazzCash, EasyPaisa, SadaPay, NayaPay, HBL, Meezan, etc.), complete payment, and upload the transaction screenshot below.',
    paymentMethods: [],
  });
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [deletingQrCode, setDeletingQrCode] = useState(false);
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(false);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [selectedReceiptBiz, setSelectedReceiptBiz] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  // Configurable Payment Methods State
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    kind: 'number',
    accountTitle: '',
    accountValue: '',
    details: '',
    countries: ['Pakistan'],
  });
  const [methodCardFile, setMethodCardFile] = useState(null);
  const [methodCardPreview, setMethodCardPreview] = useState(null);
  const [savingMethod, setSavingMethod] = useState(false);
  const [togglingMethodId, setTogglingMethodId] = useState(null);
  const [deletingMethodId, setDeletingMethodId] = useState(null);

  // Reviews Moderation State
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');

  // Payment History State
  const [payments, setPayments] = useState([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Admin Edit Business State
  const [editingBusiness, setEditingBusiness] = useState(null);

  // Bank App Verification Checkbox
  const [verifiedInBankApp, setVerifiedInBankApp] = useState(false);

  // Make Admin Confirmation Dialog State
  const [makeAdminTarget, setMakeAdminTarget] = useState(null);
  const [isPromotingAdmin, setIsPromotingAdmin] = useState(false);

  // Close Make Admin confirmation dialog on Escape key
  useEffect(() => {
    if (!makeAdminTarget) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isPromotingAdmin) {
        setMakeAdminTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [makeAdminTarget, isPromotingAdmin]);

  // Dynamic tabs based on user role & permissions
  const tabs = useMemo(() => {
    const list = [];
    if (isSuperAdmin || perms.canApproveListings) {
      list.push({ id: 'pending', label: 'Pending', badge: dashStats?.pendingBusinesses });
    }
    if (isSuperAdmin || perms.canApproveListings || perms.canDeleteListings) {
      list.push({ id: 'all-businesses', label: 'All Businesses' });
    }
    if (isSuperAdmin) {
      list.push({ id: 'payments', label: 'Payments' });
    }
    if (isSuperAdmin || perms.canModerateReviews) {
      list.push({ id: 'reviews', label: 'Reviews', badge: dashStats?.totalReviews });
    }
    if (isSuperAdmin) {
      list.push({ id: 'users', label: 'Users' });
      list.push({
        id: 'payment-settings',
        label: 'Raast QR Settings',
        badge: paymentConfig.isEnabled ? 'ON' : 'OFF',
        badgeClass: paymentConfig.isEnabled ? 'badge-green' : 'badge-gray',
      });
    }
    return list;
  }, [
    isSuperAdmin,
    perms.canApproveListings,
    perms.canDeleteListings,
    perms.canModerateReviews,
    dashStats?.pendingBusinesses,
    dashStats?.totalReviews,
    paymentConfig.isEnabled,
  ]);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push('/login');
      else if (!isSuperAdmin && !isSubAdmin) router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, isSubAdmin, router]);

  // Ensure active tab is valid for current user's permissions
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.id === tab)) {
      setTab(tabs[0].id);
      setPage(1);
    }
  }, [tabs, tab]);

  const handleMobileSelectTab = (selectedId) => {
    setTab(selectedId);
    setPage(1);
    setMobileActive(true);
  };

  const handleMobileBack = () => {
    setMobileActive(false);
  };

  const currentTabObj = tabs.find((t) => t.id === tab) || tabs[0];

  // Load stats & initial payment settings
  useEffect(() => {
    if (!isSuperAdmin && !isSubAdmin) return;
    adminAPI.getDashboard()
      .then((res) => setDashStats(res.data.stats))
      .catch(() => toast.error('Failed to load stats.'))
      .finally(() => setStatsLoading(false));

    if (isSuperAdmin) {
      adminAPI.getPaymentSettings()
        .then((res) => {
          const s = res.data?.settings || res.data?.paymentSetting;
          if (s) setPaymentConfig(normalizePaymentConfig(s) || s);
        })
        .catch(() => {});
    }
  }, [isSuperAdmin, isSubAdmin]);

  // Load tab data
  const loadTabData = useCallback(async () => {
    if (!isAuthenticated || (!isSuperAdmin && !isSubAdmin)) return;
    setLoading(true);
    try {
      if (tab === 'pending') {
        if (!isSuperAdmin && !perms.canApproveListings) return;
        const res = await adminAPI.getPendingBusinesses({ page, limit: 10 });
        setBusinesses(res.data.businesses);
        setPagination(res.data.pagination);
      } else if (tab === 'all-businesses') {
        if (!isSuperAdmin && !perms.canApproveListings && !perms.canDeleteListings) return;
        const res = await adminAPI.getAllBusinesses({ page, limit: 10 });
        setBusinesses(res.data.businesses);
        setPagination(res.data.pagination);
      } else if (tab === 'users') {
        if (!isSuperAdmin) return;
        const res = await adminAPI.getUsers({ page, limit: 10 });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else if (tab === 'payments') {
        if (!isSuperAdmin) return;
        const res = await adminAPI.getPaymentHistory({
          page,
          limit: 10,
          paymentStatus: paymentStatusFilter,
          search: paymentSearch,
        });
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination);
      } else if (tab === 'reviews') {
        if (!isSuperAdmin && !perms.canModerateReviews) return;
        const res = await adminAPI.getAllReviews({
          page,
          limit: 10,
          search: reviewSearch,
        });
        setReviews(res.data.reviews || []);
        setPagination(res.data.pagination);
      } else if (tab === 'payment-settings') {
        if (!isSuperAdmin) return;
        setLoadingPaymentConfig(true);
        try {
          const res = await adminAPI.getPaymentSettings();
          const s = res.data?.settings || res.data?.paymentSetting;
          if (s) {
            setPaymentConfig(normalizePaymentConfig(s) || s);
          }
        } catch {
          toast.error('Failed to load payment settings.');
        } finally {
          setLoadingPaymentConfig(false);
        }
        setPagination(null);
      }
    } catch {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    page,
    isAuthenticated,
    isSuperAdmin,
    isSubAdmin,
    perms.canApproveListings,
    perms.canDeleteListings,
    perms.canModerateReviews,
    reviewSearch,
    paymentStatusFilter,
    paymentSearch,
  ]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveBusiness(id);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
      setDashStats((s) => s ? { ...s, pendingBusinesses: s.pendingBusinesses - 1, approvedBusinesses: s.approvedBusinesses + 1 } : s);
      if (selectedReceiptBiz && selectedReceiptBiz._id === id) {
        setSelectedReceiptBiz((prev) => prev ? { ...prev, isApproved: true } : null);
      }
      toast.success('Business approved and published!');
    } catch (err) {
      toast.error(err.message || 'Failed to approve.');
    }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectBusiness(id);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
      toast.success('Business rejected.');
    } catch (err) {
      toast.error(err.message || 'Failed to reject.');
    }
  };

  const handleDeleteBusiness = async (id, title) => {
    if (!confirm(`Permanently delete "${title}"?`)) return;
    try {
      await adminAPI.deleteBusiness(id);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
      toast.success('Business deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}" and all their data?`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  const handleDeleteReview = async (id, businessTitle) => {
    if (!confirm(`Are you sure you want to permanently delete this review for "${businessTitle || 'this business'}"?`)) return;
    try {
      await adminAPI.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setDashStats((s) => (s ? { ...s, totalReviews: Math.max(0, s.totalReviews - 1) } : s));
      toast.success('Review deleted and ratings recalculated.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete review.');
    }
  };

  const handleConfirmMakeAdmin = async () => {
    if (!makeAdminTarget) return;
    setIsPromotingAdmin(true);
    try {
      const res = await adminAPI.updateUserRole(makeAdminTarget._id, 'admin');
      const updatedUser = res.data?.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === makeAdminTarget._id
            ? {
                ...u,
                role: 'admin',
                permissions: updatedUser?.permissions || {
                  canApproveListings: false,
                  canDeleteListings: false,
                  canModerateReviews: false,
                },
              }
            : u
        )
      );
      toast.success(`Role updated to "admin".`);
      setMakeAdminTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.');
    } finally {
      setIsPromotingAdmin(false);
    }
  };

  const handleSetRole = async (userId, newRole) => {
    try {
      const res = await adminAPI.updateUserRole(userId, newRole);
      const updatedUser = res.data?.user;
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                role: newRole,
                permissions: updatedUser?.permissions || {
                  canApproveListings: false,
                  canDeleteListings: false,
                  canModerateReviews: false,
                },
              }
            : u
        )
      );
      toast.success(`Role updated to "${newRole}".`);
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.');
    }
  };

  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await handleSetRole(userId, newRole);
  };

  const handleTogglePermission = async (userId, permKey, checked) => {
    const targetUser = users.find((u) => u._id === userId);
    if (!targetUser) return;
    const currentPerms = targetUser.permissions || {
      canApproveListings: false,
      canDeleteListings: false,
      canModerateReviews: false,
    };
    const newPerms = {
      canApproveListings: Boolean(currentPerms.canApproveListings),
      canDeleteListings: Boolean(currentPerms.canDeleteListings),
      canModerateReviews: Boolean(currentPerms.canModerateReviews),
      [permKey]: checked,
    };

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, permissions: newPerms } : u))
    );

    try {
      const res = await adminAPI.updateUserPermissions(userId, newPerms);
      if (res.data?.user?.permissions) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, permissions: res.data.user.permissions } : u))
        );
      }
      toast.success('Permission updated.');
    } catch (err) {
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, permissions: currentPerms } : u))
      );
      toast.error(err.message || 'Failed to update permission.');
    }
  };

  // Payment Settings Handlers
  const handleQrCodeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('QR code image must be under 5MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WebP are allowed.');
      return;
    }
    setQrCodeFile(file);
    if (qrCodePreview) URL.revokeObjectURL(qrCodePreview);
    setQrCodePreview(URL.createObjectURL(file));
  };

  const handleDeleteQrCode = async () => {
    if (!confirm('Are you sure you want to permanently delete the Raast QR Code image?')) return;
    setDeletingQrCode(true);
    try {
      const res = await adminAPI.deletePaymentQrCode();
      const s = res.data?.settings;
      if (s) {
        setPaymentConfig(normalizePaymentConfig(s) || s);
      } else {
        setPaymentConfig((prev) => ({ ...prev, qrCode: { url: '', publicId: '' } }));
      }
      if (qrCodePreview) URL.revokeObjectURL(qrCodePreview);
      setQrCodeFile(null);
      setQrCodePreview(null);
      toast.success('Raast QR code image deleted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete QR code.');
    } finally {
      setDeletingQrCode(false);
    }
  };

  const handleSavePaymentSettings = async (e) => {
    e?.preventDefault();
    setSavingPaymentConfig(true);
    try {
      const formData = new FormData();
      formData.append('isEnabled', paymentConfig.isEnabled);

      const feesPayload = {
        Pakistan: {
          amount: Math.max(0, Number(paymentConfig.fees?.Pakistan?.amount) || 0),
          currency: 'PKR',
          symbol: 'Rs.',
        },
        UAE: {
          amount: Math.max(0, Number(paymentConfig.fees?.UAE?.amount) || 0),
          currency: 'AED',
          symbol: 'AED ',
        },
        USA: {
          amount: Math.max(0, Number(paymentConfig.fees?.USA?.amount) || 0),
          currency: 'USD',
          symbol: '$',
        },
      };

      formData.append('fees', JSON.stringify(feesPayload));
      formData.append('feeAmount', feesPayload.Pakistan.amount);
      formData.append('qrEnabled', paymentConfig.qrEnabled !== false);
      formData.append('qrCountries', JSON.stringify(paymentConfig.qrCountries || ['Pakistan']));
      formData.append('raastId', paymentConfig.raastId || '');
      formData.append('accountTitle', paymentConfig.accountTitle || '');
      formData.append('bankName', paymentConfig.bankName || '');
      formData.append('instructions', paymentConfig.instructions || '');
      formData.append('ownerNotificationsEnabled', paymentConfig.ownerNotificationsEnabled !== false);
      formData.append('ownerNotificationEmail', (paymentConfig.ownerNotificationEmail || '').trim().toLowerCase());
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const res = await adminAPI.updatePaymentSettings(formData);
      const s = res.data?.settings || res.data?.paymentSetting;
      if (s) {
        setPaymentConfig(normalizePaymentConfig(s) || s);
      }
      if (qrCodePreview) {
        URL.revokeObjectURL(qrCodePreview);
        setQrCodePreview(null);
      }
      setQrCodeFile(null);
      toast.success('Payment settings updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update payment settings.');
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  const handleTogglePaymentEnabled = async () => {
    const nextState = !paymentConfig.isEnabled;
    const updated = { ...paymentConfig, isEnabled: nextState };
    setPaymentConfig(updated);
    try {
      await adminAPI.updatePaymentSettings({ isEnabled: nextState });
      toast.success(
        nextState
          ? 'Payment requirement ENABLED for all new listings!'
          : 'Payment requirement DISABLED — Business listings are now FREE!'
      );
    } catch (err) {
      setPaymentConfig(paymentConfig);
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleToggleOwnerNotifications = async () => {
    const nextState = !paymentConfig.ownerNotificationsEnabled;
    setPaymentConfig((prev) => ({ ...prev, ownerNotificationsEnabled: nextState }));
    try {
      await adminAPI.updatePaymentSettings({ ownerNotificationsEnabled: nextState });
      toast.success(
        nextState
          ? 'Owner email notifications ENABLED!'
          : 'Owner email notifications PAUSED.'
      );
    } catch (err) {
      setPaymentConfig((prev) => ({ ...prev, ownerNotificationsEnabled: !nextState }));
      toast.error(err.message || 'Failed to update notification settings.');
    }
  };

  // Payment Methods Handlers
  const handleOpenAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      kind: 'number',
      accountTitle: '',
      accountValue: '',
      details: '',
      countries: ['Pakistan'],
    });
    setMethodCardFile(null);
    if (methodCardPreview && methodCardPreview.startsWith('blob:')) {
      URL.revokeObjectURL(methodCardPreview);
    }
    setMethodCardPreview(null);
    setMethodModalOpen(true);
  };

  const handleOpenEditMethod = (method) => {
    setEditingMethod(method);
    setMethodForm({
      name: method.name || '',
      kind: method.kind || 'number',
      accountTitle: method.accountTitle || '',
      accountValue: method.accountValue || '',
      details: method.details || '',
      countries: Array.isArray(method.countries) && method.countries.length > 0
        ? method.countries
        : ['Pakistan'],
    });
    setMethodCardFile(null);
    if (methodCardPreview && methodCardPreview.startsWith('blob:')) {
      URL.revokeObjectURL(methodCardPreview);
    }
    setMethodCardPreview(method.cardImage?.url || null);
    setMethodModalOpen(true);
  };

  const handleMethodCardFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Card background image must be under 5MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }
    setMethodCardFile(file);
    if (methodCardPreview && methodCardPreview.startsWith('blob:')) {
      URL.revokeObjectURL(methodCardPreview);
    }
    setMethodCardPreview(URL.createObjectURL(file));
  };

  const handleSaveMethod = async (e) => {
    e?.preventDefault();
    if (!methodForm.name?.trim()) {
      toast.error('Method name is required (e.g. JazzCash, Easypaisa, HBL).');
      return;
    }
    if (!methodForm.accountTitle?.trim()) {
      toast.error('Account title is required.');
      return;
    }
    if (!methodForm.accountValue?.trim()) {
      toast.error(methodForm.kind === 'iban' ? 'IBAN is required.' : 'Account number is required.');
      return;
    }

    if (methodForm.kind === 'iban') {
      const cleanIban = methodForm.accountValue.replace(/\s+/g, '').toUpperCase();
      if (!/^PK[0-9A-Z]{22}$/i.test(cleanIban)) {
        toast.error('Pakistani IBAN must start with "PK" and be exactly 24 characters long.');
        return;
      }
    }

    if (!methodForm.countries || methodForm.countries.length === 0) {
      toast.error('Please select at least one country where this method is available.');
      return;
    }

    if (!editingMethod && !methodCardFile) {
      toast.error('Please upload a blank card background image.');
      return;
    }

    setSavingMethod(true);
    try {
      const fd = new FormData();
      fd.append('name', methodForm.name.trim());
      fd.append('kind', methodForm.kind);
      fd.append('accountTitle', methodForm.accountTitle.trim());
      fd.append('accountValue', methodForm.kind === 'iban' ? methodForm.accountValue.replace(/\s+/g, '').toUpperCase() : methodForm.accountValue.trim());
      fd.append('details', methodForm.details?.trim() || '');
      fd.append('countries', JSON.stringify(methodForm.countries));
      if (methodCardFile) {
        fd.append('cardImage', methodCardFile);
      }

      let res;
      if (editingMethod) {
        res = await adminAPI.updatePaymentMethod(editingMethod._id, fd);
        toast.success(`Payment method "${methodForm.name}" updated!`);
      } else {
        res = await adminAPI.addPaymentMethod(fd);
        toast.success(`Payment method "${methodForm.name}" added!`);
      }

      const updatedSettings = res.data?.settings;
      if (updatedSettings) {
        setPaymentConfig(normalizePaymentConfig(updatedSettings) || updatedSettings);
      } else if (res.data?.paymentMethods) {
        setPaymentConfig((prev) => ({ ...prev, paymentMethods: res.data.paymentMethods }));
      }

      setMethodModalOpen(false);
      setEditingMethod(null);
      setMethodCardFile(null);
      if (methodCardPreview && methodCardPreview.startsWith('blob:')) {
        URL.revokeObjectURL(methodCardPreview);
      }
      setMethodCardPreview(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save payment method.');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleToggleMethod = async (methodId) => {
    setTogglingMethodId(methodId);
    try {
      const res = await adminAPI.togglePaymentMethod(methodId);
      const updatedSettings = res.data?.settings;
      if (updatedSettings) {
        setPaymentConfig(normalizePaymentConfig(updatedSettings) || updatedSettings);
      } else if (res.data?.paymentMethods) {
        setPaymentConfig((prev) => ({ ...prev, paymentMethods: res.data.paymentMethods }));
      }
      toast.success(res.data?.message || 'Payment method status updated.');
    } catch (err) {
      toast.error(err.message || 'Failed to toggle payment method.');
    } finally {
      setTogglingMethodId(null);
    }
  };

  const handleDeleteMethod = async (methodId, methodName) => {
    if (!confirm(`Are you sure you want to permanently delete the "${methodName || 'this'}" payment method card?`)) return;
    setDeletingMethodId(methodId);
    try {
      const res = await adminAPI.deletePaymentMethod(methodId);
      const updatedSettings = res.data?.settings;
      if (updatedSettings) {
        setPaymentConfig(normalizePaymentConfig(updatedSettings) || updatedSettings);
      } else if (res.data?.paymentMethods) {
        setPaymentConfig((prev) => ({ ...prev, paymentMethods: res.data.paymentMethods }));
      }
      toast.success('Payment method card deleted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete payment method.');
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleDeleteReceipt = async (bizId) => {
    if (!confirm('Are you sure you want to permanently delete this payment screenshot? This will remove the image from Cloudinary and mark receipt as removed.')) return;
    setDeletingReceipt(true);
    try {
      await adminAPI.deleteReceipt(bizId);
      setBusinesses((prev) =>
        prev.map((b) =>
          b._id === bizId
            ? { ...b, paymentReceipt: null, paymentStatus: 'none' }
            : b
        )
      );
      if (selectedReceiptBiz?._id === bizId) {
        setSelectedReceiptBiz(null);
      }
      toast.success('Payment screenshot deleted from Cloudinary & Database.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete receipt.');
    } finally {
      setDeletingReceipt(false);
    }
  };

  if (authLoading || (!isSuperAdmin && !isSubAdmin && !authLoading)) {
    return <div className="section container-max text-center"><p style={{ color: '#6b7280' }}>Loading...</p></div>;
  }

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Shield size={22} style={{ color: '#2563eb' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>
                  {isSuperAdmin ? 'Admin Dashboard' : 'Sub-Admin Dashboard'}
                </h1>
                <span
                  className={`badge ${isSuperAdmin ? 'badge-blue' : 'badge-purple'}`}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  {isSuperAdmin ? 'Full Admin' : 'Sub-Admin'}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {isSuperAdmin
                  ? 'Manage businesses, users, payment gateways, and moderation'
                  : 'Manage businesses and reviews according to your assigned permissions'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {statsLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="skeleton rounded-xl h-24" />)
          ) : (
            <>
              <StatCard label="Total Users" value={dashStats?.totalUsers} icon={Users} color="#2563eb" />
              <StatCard label="Total Businesses" value={dashStats?.totalBusinesses} icon={Building2} color="#7c3aed" />
              <StatCard label="Pending" value={dashStats?.pendingBusinesses} icon={Clock} color="#d97706" />
              <StatCard label="Approved" value={dashStats?.approvedBusinesses} icon={CheckCircle2} color="#059669" />
              <StatCard label="Reviews" value={dashStats?.totalReviews} icon={Star} color="#db2777" />
            </>
          )}
        </div>

        {/* Quota Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {dashStats?.limits && (
            <>
              {/* Business Limit */}
              <div className="card p-5 border-t-4" style={{ borderColor: dashStats.limits.businesses.percentage > 80 ? '#dc2626' : '#2563eb' }}>
                <div className="flex justify-between items-center mb-2">
                  <p style={{ fontWeight: 600, color: '#1f2937' }}>Business Quota (Free Tier)</p>
                  <span className="badge badge-gray">{dashStats.limits.businesses.used} / {dashStats.limits.businesses.max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1" style={{ background: '#e5e7eb' }}>
                  <div className="h-2.5 rounded-full" style={{ width: `${Math.max(0, Math.min(dashStats.limits.businesses.percentage, 100))}%`, background: dashStats.limits.businesses.percentage > 80 ? '#dc2626' : '#2563eb' }}></div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>{dashStats.limits.businesses.percentage}% Used</p>
              </div>

              {/* Database Limit */}
              <div className="card p-5 border-t-4" style={{ borderColor: dashStats.limits.database.percentage > 80 ? '#dc2626' : '#059669' }}>
                <div className="flex justify-between items-center mb-2">
                  <p style={{ fontWeight: 600, color: '#1f2937' }}>MongoDB Storage (Free Tier)</p>
                  <span className="badge badge-gray">{dashStats.limits.database.usedMB}MB / {dashStats.limits.database.maxMB}MB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1" style={{ background: '#e5e7eb' }}>
                  <div className="h-2.5 rounded-full" style={{ width: `${Math.max(0, Math.min(dashStats.limits.database.percentage, 100))}%`, background: dashStats.limits.database.percentage > 80 ? '#dc2626' : '#059669' }}></div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>{dashStats.limits.database.percentage}% Used</p>
              </div>

              {/* Cloudinary Limit */}
              {dashStats.limits.cloudinary && (
                <div className="card p-5 border-t-4" style={{ borderColor: dashStats.limits.cloudinary.percentage > 80 ? '#dc2626' : '#8b5cf6' }}>
                  <div className="flex justify-between items-center mb-2">
                    <p style={{ fontWeight: 600, color: '#1f2937' }}>Cloudinary Credits (Free Tier)</p>
                    <span className="badge badge-gray">{dashStats.limits.cloudinary.usedCredits} / {dashStats.limits.cloudinary.maxCredits}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1" style={{ background: '#e5e7eb' }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${Math.max(0, Math.min(dashStats.limits.cloudinary.percentage, 100))}%`, background: dashStats.limits.cloudinary.percentage > 80 ? '#dc2626' : '#8b5cf6' }}></div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>{dashStats.limits.cloudinary.percentage}% Used</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tabs Bar or Empty State */}
        {tabs.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center my-6">
            <Shield size={48} className="mx-auto text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">Sub-Admin (No Permissions Assigned)</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              You are logged in as a Sub-Admin, but no permissions (Approve Listings, Delete Listings, Moderate Reviews) have been assigned to your account yet. Please contact the main administrator.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Dashboard Card Grid (<768px, shown when not in a section) */}
            {!mobileActive && (
              <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Dashboard Sections
                  </h2>
                  <span className="text-xs font-semibold text-gray-400">
                    {tabs.length} sections
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {tabs.map((t) => {
                    const meta = TAB_META[t.id] || {
                      icon: Building2,
                      color: '#2563eb',
                      bgColor: '#eff6ff',
                      borderColor: '#bfdbfe',
                      desc: 'Manage section',
                    };
                    const Icon = meta.icon;
                    const isPending = t.id === 'pending';

                    if (isPending) {
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleMobileSelectTab(t.id)}
                          className="col-span-2 w-full p-4 rounded-2xl border-2 transition-all active:scale-[0.98] cursor-pointer text-left flex items-center justify-between gap-3 shadow-xs"
                          style={{
                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #ffffff 100%)',
                            borderColor: '#f59e0b',
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                              style={{ background: '#fef3c7', color: '#b45309' }}
                            >
                              <Icon size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base text-gray-900 leading-snug">
                                  Pending Listings
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 uppercase tracking-wider">
                                  PRIORITY
                                </span>
                              </div>
                              <p className="text-xs text-amber-900/80 mt-0.5">
                                Businesses awaiting review &amp; approval
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="badge badge-yellow text-xs font-bold px-2.5 py-1">
                              {t.badge ?? 0} Pending
                            </span>
                            <ChevronRight size={18} className="text-amber-700" />
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleMobileSelectTab(t.id)}
                        className="col-span-1 w-full p-4 rounded-2xl border border-gray-200 bg-white transition-all active:scale-[0.98] cursor-pointer text-left flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs min-h-[110px]"
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: meta.bgColor, color: meta.color }}
                          >
                            <Icon size={20} />
                          </div>
                          {t.badge != null && (
                            <span
                              className={`badge ${t.badgeClass || (t.id === 'reviews' ? 'badge-yellow' : 'badge-gray')} text-[11px] font-bold px-2 py-0.5 shrink-0`}
                            >
                              {t.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                            {t.label}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {meta.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content Container (On desktop always visible; on mobile visible only when mobileActive is true) */}
            <div className={`card overflow-hidden ${!mobileActive ? 'hidden md:block' : 'block'}`}>
              {/* Desktop Tabs Bar (>=768px, identical to original) */}
              <div
                className="hidden md:flex border-b overflow-x-auto"
                style={{
                  borderColor: '#e5e7eb',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {tabs.map(({ id, label, badge, badgeClass }) => (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setPage(1); }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 min-h-[44px]"
                    style={{
                      color: tab === id ? '#2563eb' : '#6b7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: tab === id ? '2px solid #2563eb' : '2px solid transparent',
                      marginBottom: '-1px',
                    }}
                    aria-selected={tab === id}
                  >
                    {label}
                    {badge != null && (
                      <span
                        className={`badge ${badgeClass || 'badge-yellow'}`}
                        style={{ fontSize: '0.6875rem', padding: '1px 6px' }}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* Mobile Back Button (<768px, visible when inside section) */}
                <div className="md:hidden mb-4 flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={handleMobileBack}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-right min-w-0">
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {currentTabObj?.label}
                    </span>
                    {currentTabObj?.badge != null && (
                      <span className={`badge ${currentTabObj.badgeClass || 'badge-yellow'} text-[10px] shrink-0`}>
                        {currentTabObj.badge}
                      </span>
                    )}
                  </div>
                </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
              </div>
            ) : (tab === 'pending' || tab === 'all-businesses') ? (
              <>
                {businesses.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 size={40} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6b7280' }}>
                      {tab === 'pending' ? 'No pending businesses. You\'re all caught up!' : 'No businesses found.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {businesses.map((biz) => (
                      <div
                        key={biz._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }} className="truncate">
                              {biz.title}
                            </p>
                            {biz.isApproved ? (
                              <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Approved</span>
                            ) : (
                              <span className="badge badge-yellow" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Pending</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                              {biz.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {[biz.address?.city, biz.address?.country || 'Pakistan'].filter(Boolean).join(', ')}
                            </span>
                            {biz.owner && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                by {biz.owner.name} ({biz.owner.email})
                              </span>
                            )}

                            {/* Payment Receipt Badge */}
                            {biz.paymentReceipt?.url ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setVerifiedInBankApp(false);
                                  setSelectedReceiptBiz(biz);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                title="Click to view payment screenshot"
                              >
                                <ImageIcon size={12} />
                                Rs. {biz.paymentAmount || 'Paid'} (View Receipt)
                              </button>
                            ) : Number(biz.paymentAmount) > 0 ? (
                              <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                Fee: Rs. {biz.paymentAmount} (No Receipt)
                              </span>
                            ) : (
                              <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                Free Listing ({biz.address?.country || 'Free'})
                              </span>
                            )}

                            {/* Warning Badge if Payment is ON, Fee > 0, and Receipt is Missing */}
                            {paymentConfig.isEnabled && (biz.paymentAmount === undefined || Number(biz.paymentAmount) > 0) && (biz.paymentStatus === 'none' || !biz.paymentReceipt?.url) && !biz.isApproved && (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                title="Payment screenshot is missing! Do not approve."
                              >
                                <AlertCircle size={12} /> Receipt Missing - Do NOT Approve
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap pt-3 sm:pt-0 border-t border-gray-200/80 sm:border-0 w-full sm:w-auto justify-start sm:justify-end">
                          {biz.paymentReceipt?.url && (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifiedInBankApp(false);
                                setSelectedReceiptBiz(biz);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px]"
                              style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', cursor: 'pointer' }}
                              aria-label={`View payment receipt for ${biz.title}`}
                              title="View Payment Screenshot"
                            >
                              <Eye size={14} /> View Screenshot
                            </button>
                          )}

                          {!biz.isApproved && (isSuperAdmin || perms.canApproveListings) && (() => {
                            const isPaidBiz = paymentConfig.isEnabled && (biz.paymentAmount === undefined || Number(biz.paymentAmount) > 0);
                            const receiptMissing = isPaidBiz && (biz.paymentStatus === 'none' || !biz.paymentReceipt?.url);

                            return (
                              <button
                                onClick={() => {
                                  if (receiptMissing) {
                                    toast.error('Cannot approve: Payment screenshot is missing!');
                                    return;
                                  }
                                  handleApprove(biz._id);
                                }}
                                disabled={receiptMissing}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[40px] ${
                                  receiptMissing
                                    ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                    : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100 cursor-pointer shadow-2xs'
                                }`}
                                style={{ border: '1px solid' }}
                                aria-label={`Approve ${biz.title}`}
                                title={
                                  receiptMissing
                                    ? 'Receipt Missing - Do NOT Approve'
                                    : `Approve ${biz.title}`
                                }
                              >
                                <Check size={14} /> Approve
                              </button>
                            );
                          })()}
                          {!biz.isApproved && (isSuperAdmin || perms.canApproveListings) && (
                            <button
                              onClick={() => handleReject(biz._id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[40px]"
                              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', cursor: 'pointer' }}
                              aria-label={`Reject ${biz.title}`}
                            >
                              <X size={14} /> Reject
                            </button>
                          )}
                          {(isSuperAdmin || perms.canApproveListings) && (
                            <button
                              type="button"
                              onClick={() => setEditingBusiness(biz)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer min-h-[40px]"
                              aria-label={`Edit ${biz.title}`}
                              title="Edit Business Details (Admin)"
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                          )}
                          <Link
                            href={biz.isApproved ? `/businesses/${biz.slug || biz._id}` : '#'}
                            className={`p-2.5 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${!biz.isApproved ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            aria-label={`View ${biz.title}`}
                            onClick={(e) => !biz.isApproved && e.preventDefault()}
                            title="View Business on Site"
                          >
                            <CheckCircle2 size={16} />
                          </Link>
                          {(isSuperAdmin || perms.canDeleteListings) && (
                            <button
                              onClick={() => handleDeleteBusiness(biz._id, biz.title)}
                              className="p-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                              style={{ background: 'none', border: 'none' }}
                              aria-label={`Delete ${biz.title}`}
                              title="Delete Business"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : tab === 'payments' ? (
              <div className="space-y-4">
                {/* Payments Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPage(1);
                      loadTabData();
                    }}
                    className="flex items-center gap-2 flex-1 max-w-md"
                  >
                    <div className="relative flex-1 min-w-0">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        placeholder="Search by business title or owner..."
                        className="form-input pl-9 text-sm"
                      />
                    </div>
                    <button type="submit" className="btn-secondary text-xs px-3 py-2 font-semibold min-h-[38px] shrink-0">
                      Search
                    </button>
                    {paymentSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentSearch('');
                          setPage(1);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-1"
                      >
                        Clear
                      </button>
                    )}
                  </form>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Status:</span>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => {
                        setPaymentStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="form-input text-xs py-1.5 px-2.5 font-medium"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard size={40} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6b7280' }}>No payment records found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ fontWeight: 600, fontSize: '0.925rem', color: '#1f2937' }} className="truncate">
                              {p.title}
                            </p>
                            <span
                              className={`badge ${
                                p.paymentStatus === 'verified'
                                  ? 'badge-green'
                                  : p.paymentStatus === 'rejected'
                                  ? 'badge-red'
                                  : p.paymentStatus === 'pending'
                                  ? 'badge-yellow'
                                  : 'badge-gray'
                              }`}
                              style={{ fontSize: '0.7rem', padding: '2px 6px', textTransform: 'capitalize' }}
                            >
                              Payment: {p.paymentStatus || 'pending'}
                            </span>
                            <span
                              className={`badge ${p.isApproved ? 'badge-green' : 'badge-yellow'}`}
                              style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                            >
                              {p.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span className="font-bold text-gray-800">
                              Amount: Rs. {p.paymentAmount || 0}
                            </span>
                            {p.owner && (
                              <span>
                                Owner: <strong>{p.owner.name}</strong> ({p.owner.email})
                              </span>
                            )}
                            <span>
                              Date: {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-3 sm:pt-0 border-t border-gray-200/80 sm:border-0 w-full sm:w-auto justify-start sm:justify-end">
                          {p.paymentReceipt?.url && (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifiedInBankApp(false);
                                setSelectedReceiptBiz(p);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer min-h-[40px]"
                              title="View uploaded payment receipt"
                            >
                              <Eye size={14} /> View Receipt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingBusiness(p)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer min-h-[40px]"
                            title="Edit Business Details (Admin)"
                          >
                            <Edit3 size={14} /> Edit Business
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : tab === 'reviews' ? (
              <div className="space-y-4">
                {/* Reviews Toolbar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPage(1);
                    loadTabData();
                  }}
                  className="flex items-center gap-2 max-w-md pb-2"
                >
                  <div className="relative flex-1 min-w-0">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Search reviews by comment..."
                      className="form-input pl-9 text-sm"
                    />
                  </div>
                  <button type="submit" className="btn-secondary text-xs px-3 py-2 font-semibold min-h-[38px] shrink-0">
                    Search
                  </button>
                  {reviewSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewSearch('');
                        setPage(1);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-1"
                    >
                      Clear
                    </button>
                  )}
                </form>

                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={40} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#6b7280' }}>No reviews found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div
                        key={r._id}
                        className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">
                              {r.business?.title || 'Business'}
                            </span>
                            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                              <Star size={13} fill="currentColor" />
                              <span>{r.rating} / 5</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            By <strong>{r.user?.name || 'User'}</strong> ({r.user?.email || 'N/A'})
                          </p>
                          <p className="text-sm text-gray-700 pt-1 italic bg-white p-3 rounded-lg border border-gray-100">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                        </div>
                        {(isSuperAdmin || perms.canModerateReviews) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id, r.business?.title)}
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 self-start sm:self-start cursor-pointer font-medium min-h-[40px]"
                            title="Delete this review permanently"
                          >
                            <Trash2 size={14} /> Delete Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : tab === 'users' ? (
              <>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <p style={{ color: '#6b7280' }}>No users found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u._id}
                        className="p-4 rounded-xl flex flex-col gap-3"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }} className="truncate">
                                {u.name}
                              </p>
                              <span
                                className={`badge ${
                                  u.role === 'admin'
                                    ? 'badge-blue'
                                    : u.role === 'subadmin'
                                    ? 'badge-purple'
                                    : 'badge-gray'
                                }`}
                                style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                              >
                                {u.role === 'subadmin' ? 'Sub-Admin' : u.role}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.email}</span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Joined: {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2.5 sm:pt-0 border-t border-gray-100 sm:border-0 w-full sm:w-auto justify-start sm:justify-end">
                            {u._id !== user?._id && (
                              <>
                                {u.role === 'user' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setMakeAdminTarget(u)}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                                      title="Grant full admin privileges"
                                    >
                                      Make Admin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetRole(u._id, 'subadmin')}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', cursor: 'pointer' }}
                                      title="Grant sub-admin role with custom permissions"
                                    >
                                      Make Sub-Admin
                                    </button>
                                  </>
                                )}

                                {u.role === 'subadmin' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setMakeAdminTarget(u)}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                                      title="Promote to full admin"
                                    >
                                      Make Admin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetRole(u._id, 'user')}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                      title="Demote to regular user"
                                    >
                                      Make User
                                    </button>
                                  </>
                                )}

                                {u.role === 'admin' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSetRole(u._id, 'subadmin')}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', cursor: 'pointer' }}
                                      title="Change to sub-admin"
                                    >
                                      Make Sub-Admin
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetRole(u._id, 'user')}
                                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 inline-flex items-center justify-center"
                                      style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                      title="Demote to regular user"
                                    >
                                      Make User
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  className="min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                                  aria-label={`Delete user ${u.name}`}
                                  title="Delete user"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            )}
                            {u._id === user?._id && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>You (Main Admin)</span>
                            )}
                          </div>
                        </div>

                        {/* Sub-admin Permissions Checkboxes (Main Admin Only) */}
                        {u.role === 'subadmin' && (
                          <div
                            className="p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1"
                            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                              <Shield size={14} className="text-purple-600" />
                              <span>Sub-Admin Permissions:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.permissions?.canApproveListings)}
                                  onChange={(e) => handleTogglePermission(u._id, 'canApproveListings', e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                Approve Listings
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.permissions?.canDeleteListings)}
                                  onChange={(e) => handleTogglePermission(u._id, 'canDeleteListings', e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                Delete Listings
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.permissions?.canModerateReviews)}
                                  onChange={(e) => handleTogglePermission(u._id, 'canModerateReviews', e.target.checked)}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                Moderate Reviews
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : tab === 'payment-settings' ? (
              /* Payment Settings Panel */
              <div className="max-w-3xl mx-auto py-2 space-y-6">
                {/* Status Banner & Main Switch */}
                <div
                  className="p-6 rounded-2xl transition-all"
                  style={{
                    background: paymentConfig.isEnabled
                      ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                      : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    border: paymentConfig.isEnabled ? '2px solid #86efac' : '2px solid #e5e7eb',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <QrCode size={20} style={{ color: paymentConfig.isEnabled ? '#15803d' : '#6b7280' }} />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                          Raast QR Business Listing Payment
                        </h2>
                        <span
                          className={`badge ${paymentConfig.isEnabled ? 'badge-green' : 'badge-gray'}`}
                          style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px' }}
                        >
                          {paymentConfig.isEnabled ? 'ACTIVE / ON' : 'DISABLED / OFF'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: paymentConfig.isEnabled ? '#166534' : '#4b5563' }}>
                        {paymentConfig.isEnabled
                          ? `Currently ON: Users must scan your Raast QR Code, pay Rs. ${paymentConfig.feeAmount} & submit screenshot to list their business.`
                          : 'Currently OFF: Business submissions are 100% FREE. No payment or screenshot is required from users.'}
                      </p>
                    </div>

                    {/* Big ON / OFF Toggle Button */}
                    <button
                      type="button"
                      onClick={handleTogglePaymentEnabled}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow transition-all hover:scale-102 flex-shrink-0"
                      style={{
                        background: paymentConfig.isEnabled ? '#16a34a' : '#4b5563',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title="Click to toggle Payment requirement ON or OFF"
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${paymentConfig.isEnabled ? 'bg-white animate-pulse' : 'bg-gray-300'}`}
                      />
                      {paymentConfig.isEnabled ? 'Turn Payment OFF' : 'Turn Payment ON'}
                    </button>
                  </div>
                </div>

                {/* Detailed Settings Form */}
                <form onSubmit={handleSavePaymentSettings} className="space-y-6">
                  {/* Multi-Country Listing Fees Section */}
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                          Listing Fee per Country
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          Set the business listing fee for each country. Currencies are fixed. Amount 0 = <strong>FREE listing</strong> for that country.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {[
                        { country: 'Pakistan', code: 'PK', currency: 'PKR', symbol: 'Rs.', flagColor: 'bg-emerald-600', placeholder: 'e.g. 50' },
                        { country: 'UAE', code: 'AE', currency: 'AED', symbol: 'AED ', flagColor: 'bg-rose-600', placeholder: 'e.g. 0' },
                        { country: 'USA', code: 'US', currency: 'USD', symbol: '$', flagColor: 'bg-blue-600', placeholder: 'e.g. 0' },
                      ].map(({ country, code, currency, symbol, flagColor, placeholder }) => {
                        const currentAmount = paymentConfig.fees?.[country]?.amount ?? 0;
                        const isFree = Number(currentAmount) === 0;

                        return (
                          <div
                            key={country}
                            className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-lg ${flagColor} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                                {code}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900">{country}</span>
                                  {isFree ? (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      FREE LISTING
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                      {symbol}{currentAmount}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  Fixed Currency: <strong className="text-gray-700">{currency} ({symbol.trim()})</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:w-72">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 select-none">
                                  {symbol}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={paymentConfig.fees?.[country]?.amount ?? 0}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                    setPaymentConfig((prev) => ({
                                      ...prev,
                                      fees: {
                                        ...prev.fees,
                                        [country]: {
                                          amount: val,
                                          currency,
                                          symbol,
                                        },
                                      },
                                      ...(country === 'Pakistan' ? { feeAmount: val === '' ? 0 : val } : {}),
                                    }));
                                  }}
                                  className="form-input pl-12 pr-3 text-sm font-bold text-gray-900"
                                  placeholder={placeholder}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentConfig((prev) => ({
                                    ...prev,
                                    fees: {
                                      ...prev.fees,
                                      [country]: {
                                        amount: 0,
                                        currency,
                                        symbol,
                                      },
                                    },
                                    ...(country === 'Pakistan' ? { feeAmount: 0 } : {}),
                                  }));
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                  isFree
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Set to 0 (FREE)"
                              >
                                Set FREE
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f9fafb', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #f3f4f6' }}>
                      💡 <strong>Multi-Country Pricing:</strong> Set fee to <strong>0</strong> for any country to make listings 100% FREE for that country. User form will automatically adapt based on selected country.
                    </p>
                  </div>

                  {/* Raast QR Code & Account Information Card */}
                  <div className="card p-5 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }} className="flex items-center gap-2">
                          <QrCode size={18} className="text-emerald-600" />
                          Raast QR Code &amp; Account Details
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          Upload your official Raast QR Code. Users across Pakistan can scan it via JazzCash, EasyPaisa, SadaPay, or any Mobile Banking app.
                        </p>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        ⚡ Raast P2M / Instant Pay
                      </span>
                    </div>

                    {/* QR Code Upload / Preview Box */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                      <label className="form-label mb-2 block font-semibold text-gray-800">
                        Raast QR Code Image <span style={{ color: '#dc2626' }}>*</span>
                      </label>

                      {qrCodePreview || paymentConfig.qrCode?.url ? (
                        <div className="flex flex-col sm:flex-row items-center gap-5 p-3 bg-white rounded-xl border border-gray-200">
                          <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-2 flex-shrink-0 shadow-xs">
                            <img
                              src={qrCodePreview || paymentConfig.qrCode?.url}
                              alt="Raast QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                                ✓ QR Image Active
                              </span>
                              {qrCodeFile && (
                                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                  New file selected (Click Save)
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: '#4b5563' }}>
                              This QR code will be displayed to users in a scanner frame when adding a business.
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                              <label
                                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5 hover:bg-gray-100"
                                title="Upload a new QR code image"
                              >
                                <Upload size={13} />
                                <span>Change / Replace QR</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp"
                                  onChange={handleQrCodeFileChange}
                                  className="hidden"
                                />
                              </label>

                              {paymentConfig.qrCode?.url && (
                                <button
                                  type="button"
                                  onClick={handleDeleteQrCode}
                                  disabled={deletingQrCode}
                                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
                                  title="Delete Raast QR Code image"
                                >
                                  <Trash2 size={13} />
                                  {deletingQrCode ? 'Deleting...' : 'Delete QR Image'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 bg-white cursor-pointer transition-all hover:bg-emerald-50/20 group text-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-2">
                            <Upload size={22} />
                          </div>
                          <p className="text-sm font-semibold text-gray-800">
                            Click or drag to upload Raast QR Code image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports PNG, JPG, JPEG, WebP (Max 5MB)
                          </p>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleQrCodeFileChange}
                            className="hidden"
                          />
                        </label>
                      )}

                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        💡 Raast QR code apne bank ya JazzCash/Easypaisa/SadaPay app se download ya screenshot le kar yahan upload karein.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Title */}
                      <div>
                        <label className="form-label">
                          Account Title (Holder Name) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={paymentConfig.accountTitle || ''}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, accountTitle: e.target.value })}
                          className="form-input"
                          placeholder="e.g. BizPrimeHub or Your Name"
                          required
                        />
                      </div>

                      {/* Raast ID / Number (Optional) */}
                      <div>
                        <label className="form-label flex items-center justify-between">
                          <span>Raast ID / Registered Number (Optional)</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Optional</span>
                        </label>
                        <input
                          type="text"
                          value={paymentConfig.raastId || ''}
                          onChange={(e) => setPaymentConfig({ ...paymentConfig, raastId: e.target.value })}
                          className="form-input font-mono"
                          placeholder="e.g. 03001234567"
                        />
                        <p style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Users can also copy this Raast ID if their camera fails.
                        </p>
                      </div>
                    </div>

                    {/* Show QR in countries checkboxes */}
                    <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                          Show QR in Countries:
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentConfig.qrEnabled !== false}
                            onChange={(e) => setPaymentConfig((prev) => ({ ...prev, qrEnabled: e.target.checked }))}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-gray-700">QR Enabled</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Select which country forms will display this QR Code payment card.
                      </p>
                      <div className="flex flex-wrap gap-4 pt-1">
                        {['Pakistan', 'UAE', 'USA'].map((c) => {
                          const isChecked = (paymentConfig.qrCountries || ['Pakistan']).includes(c);
                          return (
                            <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = paymentConfig.qrCountries || ['Pakistan'];
                                  const updated = e.target.checked
                                    ? [...new Set([...current, c])]
                                    : current.filter((item) => item !== c);
                                  setPaymentConfig((prev) => ({
                                    ...prev,
                                    qrCountries: updated,
                                  }));
                                }}
                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs sm:text-sm font-semibold text-gray-800">{c}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Configurable Payment Methods Section */}
                    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-gray-900">
                              Payment Method Cards
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {paymentConfig.paymentMethods?.length || 0}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Add unlimited custom bank, wallet, or IBAN cards with blank background artwork. Details are dynamically overlaid on cards.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenAddMethod}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
                        >
                          <Plus size={14} /> Add Payment Method
                        </button>
                      </div>

                      {/* Methods List */}
                      {(!paymentConfig.paymentMethods || paymentConfig.paymentMethods.length === 0) ? (
                        <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/60">
                          <CreditCard size={32} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm font-semibold text-gray-700">No payment methods configured yet</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Click &ldquo;Add Payment Method&rdquo; to add custom JazzCash, Easypaisa, HBL, or any bank cards.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {paymentConfig.paymentMethods.map((method) => {
                            const isToggling = togglingMethodId === method._id;
                            const isDeleting = deletingMethodId === method._id;

                            return (
                              <div
                                key={method._id}
                                className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                                  method.isEnabled
                                    ? 'border-gray-200 bg-gray-50/50 shadow-xs'
                                    : 'border-gray-200 bg-gray-100/60 opacity-75'
                                }`}
                              >
                                {/* Top: Realistic Card Preview with dynamic overlay */}
                                <div className="relative aspect-[1.586/1] w-full rounded-xl overflow-hidden shadow-sm border border-black/10 select-none bg-slate-900">
                                  {method.cardImage?.url ? (
                                    <img
                                      src={method.cardImage.url}
                                      alt={method.name}
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
                                  )}

                                  <div className="absolute inset-0 p-[5%] flex flex-col justify-between text-white z-10">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-black text-xs sm:text-sm tracking-wide text-white uppercase px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-[2px] border border-white/15 [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
                                        {method.name}
                                      </span>
                                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/25 backdrop-blur-[2px] border border-white/20 text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.85)]">
                                        {method.kind === 'iban' ? 'IBAN' : 'NUMBER'}
                                      </span>
                                    </div>

                                    <div className="my-auto py-1 px-2 rounded-lg bg-black/25 backdrop-blur-[2px] border border-white/15 space-y-0.5 shadow-sm">
                                      <div className="text-[9px] uppercase font-bold text-white/80 [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)]">
                                        {method.kind === 'iban' ? 'IBAN' : 'Account Number'}
                                      </div>
                                      <div className="font-mono font-black text-xs sm:text-sm text-white break-all px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                                        {method.accountValue}
                                      </div>
                                    </div>

                                    <div className="pt-1 flex items-end justify-between text-[10px]">
                                      <div className="px-1.5 py-0.5 rounded-md bg-black/25 backdrop-blur-[2px] border border-white/15">
                                        <span className="text-white/80 uppercase text-[8px] font-bold block [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
                                          Account Title
                                        </span>
                                        <span className="font-bold text-amber-300 [text-shadow:_0_1px_2px_rgba(0,0,0,0.9)]">
                                          {method.accountTitle}
                                        </span>
                                      </div>
                                      {method.details && (
                                        <span className="text-white font-medium truncate max-w-[50%] px-1.5 py-0.5 rounded-md bg-black/25 backdrop-blur-[2px] [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]" title={method.details}>
                                          {method.details}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Info & Actions */}
                                <div className="mt-3 pt-3 border-t border-gray-200/80 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMethod(method._id)}
                                      disabled={isToggling}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                        method.isEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                                      }`}
                                      title={method.isEnabled ? 'Click to disable method' : 'Click to enable method'}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                          method.isEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span className="text-xs font-semibold text-gray-700">
                                      {method.isEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <div className="flex items-center gap-1 ml-1">
                                      {(method.countries || ['Pakistan']).map((c) => (
                                        <span
                                          key={c}
                                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                                          title={`Available in ${c}`}
                                        >
                                          {c === 'Pakistan' ? 'PK' : c === 'UAE' ? 'AE' : 'US'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditMethod(method)}
                                      className="p-1.5 text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Edit Method"
                                    >
                                      <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMethod(method._id, method.name)}
                                      disabled={isDeleting}
                                      className="p-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Delete Method"
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="form-label">
                        Payment Instructions for Users (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={paymentConfig.instructions || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, instructions: e.target.value })}
                        className="form-input"
                        placeholder="e.g. Scan the Raast QR Code with any banking app, send the exact fee amount, and upload the transaction screenshot."
                      />
                    </div>
                  </div>

                  {/* Owner Email Notifications Section */}
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <Mail size={18} className="text-blue-600" />
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                            Owner Email Notifications
                          </h3>
                          <span
                            className={`badge ${paymentConfig.ownerNotificationsEnabled ? 'badge-blue' : 'badge-gray'}`}
                            style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px' }}
                          >
                            {paymentConfig.ownerNotificationsEnabled ? 'ACTIVE / ON' : 'PAUSED / OFF'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
                          Receive automated email alerts whenever a new business listing is submitted or a new user registers.
                        </p>
                      </div>

                      {/* Quick ON / OFF toggle button */}
                      <button
                        type="button"
                        onClick={handleToggleOwnerNotifications}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                        style={{
                          background: paymentConfig.ownerNotificationsEnabled ? '#eff6ff' : '#f3f4f6',
                          color: paymentConfig.ownerNotificationsEnabled ? '#1d4ed8' : '#4b5563',
                          borderColor: paymentConfig.ownerNotificationsEnabled ? '#bfdbfe' : '#d1d5db',
                        }}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${paymentConfig.ownerNotificationsEnabled ? 'bg-blue-600 animate-pulse' : 'bg-gray-400'}`}
                        />
                        {paymentConfig.ownerNotificationsEnabled ? 'Notifications Active' : 'Notifications Paused'}
                      </button>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Toggle Option (Full-Width) */}
                      <div className="flex items-start gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 w-full">
                        <input
                          id="ownerNotificationsEnabled"
                          type="checkbox"
                          checked={paymentConfig.ownerNotificationsEnabled !== false}
                          onChange={(e) =>
                            setPaymentConfig((prev) => ({
                              ...prev,
                              ownerNotificationsEnabled: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="ownerNotificationsEnabled" className="cursor-pointer select-none flex-1">
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>
                            Send Alerts on New Listings &amp; Users
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                            Uncheck to mute email alerts without clearing your recipient address.
                          </p>
                        </label>
                      </div>

                      {/* Recipient Email Input (FULL-WIDTH) */}
                      <div className="w-full">
                        <label htmlFor="ownerNotificationEmail" className="form-label flex flex-wrap items-center justify-between gap-1 mb-1.5">
                          <span className="font-bold text-gray-800">Owner Notification Email</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Default: info@bizprimehub.com</span>
                        </label>
                        <input
                          id="ownerNotificationEmail"
                          type="email"
                          value={paymentConfig.ownerNotificationEmail || ''}
                          onChange={(e) =>
                            setPaymentConfig({
                              ...paymentConfig,
                              ownerNotificationEmail: e.target.value,
                            })
                          }
                          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm sm:text-base text-gray-900 font-mono sm:font-sans focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                          placeholder="e.g. info@bizprimehub.com"
                        />
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                          If left blank or disabled, notification emails will be skipped. Both new listing submissions and new user registrations will notify this inbox.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingPaymentConfig}
                      className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold shadow"
                    >
                      <Save size={16} />
                      {savingPaymentConfig ? 'Saving Settings...' : 'Save Payment Settings'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {/* Pagination for businesses & users */}
            {tab !== 'payment-settings' && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem' }}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem' }}
                  aria-label="Next page"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>

      {/* Modal Dialog: View & Delete Payment Screenshot */}
      {selectedReceiptBiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setSelectedReceiptBiz(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Payment Screenshot Modal"
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid #e5e7eb' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                  Raast Payment Screenshot
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                  {selectedReceiptBiz.title} • Fee: Rs. {selectedReceiptBiz.paymentAmount || 500}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptBiz(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-50">
              {selectedReceiptBiz.paymentReceipt?.url ? (
                <div className="relative max-w-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  <img
                    src={selectedReceiptBiz.paymentReceipt.url}
                    alt={`Payment screenshot for ${selectedReceiptBiz.title}`}
                    className="max-h-[55vh] w-auto max-w-full object-contain mx-auto"
                  />
                </div>
              ) : (
                <p style={{ color: '#6b7280', padding: '2rem' }}>No screenshot attached or already deleted.</p>
              )}

              {/* Owner metadata */}
              <div className="w-full mt-3 p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 flex flex-wrap justify-between gap-2">
                <div>
                  <strong>Submitted by:</strong> {selectedReceiptBiz.owner?.name || 'User'} ({selectedReceiptBiz.owner?.email || 'N/A'})
                </div>
                <div>
                  <strong>Date:</strong> {new Date(selectedReceiptBiz.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Fake Screenshot Verification Warning */}
              <div className="w-full mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>⚠️ Verification Note:</strong> Approve se pehle apne bank/JazzCash app me amount + date + transaction ID match kar ke verify karein.
              </div>

              {/* Checkbox for Paid Listings */}
              {((selectedReceiptBiz.paymentAmount > 0) || selectedReceiptBiz.paymentReceipt?.url) && (
                <label className="w-full mt-2 flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifiedInBankApp}
                    onChange={(e) => setVerifiedInBankApp(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    I verified this payment in my bank/JazzCash app
                  </span>
                </label>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t flex flex-wrap items-center justify-between gap-3 bg-white" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2">
                {selectedReceiptBiz.paymentReceipt?.url && (
                  <a
                    href={selectedReceiptBiz.paymentReceipt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
                  >
                    <ExternalLink size={13} /> Open Full Size
                  </a>
                )}
                {selectedReceiptBiz.paymentReceipt?.url && (isSuperAdmin || perms.canDeleteListings) && (
                  <button
                    type="button"
                    disabled={deletingReceipt}
                    onClick={() => handleDeleteReceipt(selectedReceiptBiz._id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}
                    title="Delete screenshot from Cloudinary"
                  >
                    <Trash2 size={13} />
                    {deletingReceipt ? 'Deleting...' : 'Delete Screenshot'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!selectedReceiptBiz.isApproved && (isSuperAdmin || perms.canApproveListings) && (
                  <button
                    type="button"
                    disabled={((selectedReceiptBiz.paymentAmount > 0) || selectedReceiptBiz.paymentReceipt?.url) && !verifiedInBankApp}
                    onClick={() => handleApprove(selectedReceiptBiz._id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
                      ((selectedReceiptBiz.paymentAmount > 0) || selectedReceiptBiz.paymentReceipt?.url) && !verifiedInBankApp
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                    }`}
                    style={{ border: 'none' }}
                    title={
                      ((selectedReceiptBiz.paymentAmount > 0) || selectedReceiptBiz.paymentReceipt?.url) && !verifiedInBankApp
                        ? 'Please tick the verification checkbox first'
                        : 'Approve Business'
                    }
                  >
                    <Check size={14} /> Approve Business
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReceiptBiz(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Business Modal */}
      {editingBusiness && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          onClick={() => setEditingBusiness(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Admin Edit Business Modal"
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full my-8 max-h-[90vh] flex flex-col shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ border: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gray-50" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
                  Edit Business: {editingBusiness.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBusiness(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close edit modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <BusinessForm
                existingBusiness={editingBusiness}
                isAdminEdit={true}
                onAdminSaved={() => {
                  setEditingBusiness(null);
                  loadTabData();
                }}
                onCancel={() => setEditingBusiness(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Make Full Admin */}
      {makeAdminTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            if (!isPromotingAdmin) setMakeAdminTarget(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="make-admin-modal-title"
        >
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <button
                type="button"
                disabled={isPromotingAdmin}
                onClick={() => setMakeAdminTarget(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Title */}
            <h3
              id="make-admin-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-950 leading-snug mb-2"
            >
              Are you sure? This grants FULL admin access.
            </h3>

            {/* Target User Info */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mb-3 text-xs sm:text-sm">
              <span className="text-gray-500">Target User: </span>
              <span className="font-bold text-gray-900">{makeAdminTarget.name}</span>
              <span className="text-gray-500 block truncate text-xs mt-0.5">{makeAdminTarget.email}</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
              Promoting this user gives them <strong>complete, unrestricted control</strong> over BizPrimeHub, including:
            </p>

            <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 mb-4 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Payments & Banking</strong> (bank accounts, fee settings, payment receipts)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>User Management</strong> (promoting, demoting, or deleting any user)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Sub-Admin Permissions</strong> (configuring staff access rules)</span>
              </li>
            </ul>

            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 leading-relaxed mb-5">
              ⚠️ <strong>Warning:</strong> Only assign this role to individuals you fully trust as administrators.
            </div>

            {/* Actions: Cancel and Confirm / Yes, Make Admin */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isPromotingAdmin}
                onClick={() => setMakeAdminTarget(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer min-h-[44px] text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPromotingAdmin}
                onClick={handleConfirmMakeAdmin}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer min-h-[44px] shadow-sm flex items-center justify-center gap-1.5"
              >
                <Shield size={14} />
                <span>{isPromotingAdmin ? 'Granting Access...' : 'Yes, Make Admin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payment Method Modal */}
      {methodModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            setMethodModalOpen(false);
            setEditingMethod(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Payment Method Modal"
        >
          <div
            className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {editingMethod ? 'Edit Payment Method Card' : 'Add Payment Method Card'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMethodModalOpen(false);
                  setEditingMethod(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-4 text-left">
              <div>
                <label className="form-label flex items-center justify-between">
                  <span>Method Name <span className="text-red-600">*</span></span>
                  <span className="text-[11px] text-gray-500">e.g. JazzCash, Easypaisa, HBL</span>
                </label>
                <input
                  type="text"
                  required
                  value={methodForm.name}
                  onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. JazzCash or HBL Bank"
                />
              </div>

              <div>
                <label className="form-label">
                  Method Kind <span className="text-red-600">*</span>
                </label>
                <select
                  value={methodForm.kind}
                  onChange={(e) => setMethodForm({ ...methodForm, kind: e.target.value })}
                  className="form-input"
                >
                  <option value="number">Account Number / Mobile Wallet (e.g. 03001234567)</option>
                  <option value="iban">Bank IBAN (24 Characters starting with PK)</option>
                </select>
              </div>

              <div>
                <label className="form-label block mb-1">
                  Available in countries <span className="text-red-600">*</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-1.5">
                  Select which country forms will display this payment method card.
                </p>
                <div className="flex flex-wrap gap-4 pt-1">
                  {['Pakistan', 'UAE', 'USA'].map((c) => {
                    const isChecked = (methodForm.countries || []).includes(c);
                    return (
                      <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = methodForm.countries || [];
                            const updated = e.target.checked
                              ? [...new Set([...current, c])]
                              : current.filter((item) => item !== c);
                            setMethodForm((prev) => ({ ...prev, countries: updated }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label flex items-center justify-between">
                  <span>
                    {methodForm.kind === 'iban' ? 'Bank IBAN' : 'Account / Mobile Number'}{' '}
                    <span className="text-red-600">*</span>
                  </span>
                  {methodForm.kind === 'iban' && (
                    <span className="text-[11px] text-purple-700 font-semibold">24 chars, starts with PK</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={methodForm.accountValue}
                  onChange={(e) => setMethodForm({ ...methodForm, accountValue: e.target.value })}
                  className="form-input font-mono uppercase"
                  placeholder={
                    methodForm.kind === 'iban'
                      ? 'PK36SCBL0000001123456701'
                      : '03001234567'
                  }
                />
                {methodForm.kind === 'iban' && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Must start with &ldquo;PK&rdquo; and contain 24 alphanumeric characters.
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Account Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={methodForm.accountTitle}
                  onChange={(e) => setMethodForm({ ...methodForm, accountTitle: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Ahsan Ali"
                />
              </div>

              <div>
                <label className="form-label flex items-center justify-between">
                  <span>Blank Card Background Image <span className="text-red-600">*</span></span>
                  <span className="text-[11px] text-gray-500">JPG, PNG, WebP &le; 5MB</span>
                </label>

                {methodCardPreview ? (
                  <div className="space-y-2">
                    <div className="relative aspect-[1.586/1] w-full rounded-xl overflow-hidden border border-gray-300 shadow-inner bg-slate-900">
                      <img
                        src={methodCardPreview}
                        alt="Card Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Upload size={14} /> Change Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleMethodCardFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-gray-500 truncate">
                        {methodCardFile?.name || 'Current card image'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center">
                    <ImageIcon size={28} className="text-gray-400 mb-2" />
                    <span className="text-xs font-semibold text-gray-700">
                      Click to upload blank card artwork
                    </span>
                    <span className="text-[11px] text-gray-500 mt-0.5">
                      Card image without numbers or text on it
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleMethodCardFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="form-label flex items-center justify-between">
                  <span>Additional Details (Optional)</span>
                  <span className="text-[11px] text-gray-500">Optional</span>
                </label>
                <input
                  type="text"
                  value={methodForm.details}
                  onChange={(e) => setMethodForm({ ...methodForm, details: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Branch code: 0142 or Transfer via Raast/1Link"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setMethodModalOpen(false);
                    setEditingMethod(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMethod}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  {savingMethod ? 'Saving Card...' : editingMethod ? 'Update Card' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  ArrowLeft, AlertTriangle, ShieldCheck, Send, Activity, Download,
  Calendar, RefreshCw, LogOut
} from 'lucide-react';
import BusinessForm from '@/components/business/BusinessForm';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminQuotaCards from './AdminQuotaCards';
import AdminBottomNav from './AdminBottomNav';
import AdminPlaceholderView from './AdminPlaceholderView';

function StatCard({ label, value, icon: Icon, color = '#2563eb', bg = '#eff6ff' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: bg, color }}
        >
          <Icon size={20} className="stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {value ?? '—'}
      </p>
      <Icon
        size={54}
        className="absolute -right-3 -bottom-3 opacity-5 pointer-events-none"
        style={{ color }}
      />
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
  emails: {
    icon: Mail,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    desc: 'Sent logs & composer',
  },
  'payment-settings': {
    icon: QrCode,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    desc: 'Raast QR & cards',
  },
  claims: {
    icon: ShieldCheck,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    desc: 'Ownership claims',
  },
  activity: {
    icon: Activity,
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    desc: 'Admin audit log',
  },
};

const ACTIVITY_ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'approve_business', label: 'Approve Business' },
  { value: 'reject_business', label: 'Reject Business' },
  { value: 'delete_business', label: 'Delete Business' },
  { value: 'delete_user', label: 'Delete User' },
  { value: 'change_role', label: 'Change Role' },
  { value: 'spam_user', label: 'Spam User' },
  { value: 'unspam_user', label: 'Un-spam User' },
  { value: 'approve_claim', label: 'Approve Claim' },
  { value: 'reject_claim', label: 'Reject Claim' },
  { value: 'verify_payment', label: 'Verify Payment' },
  { value: 'reject_payment', label: 'Reject Payment' },
  { value: 'delete_receipt', label: 'Delete Receipt' },
  { value: 'delete_review', label: 'Delete Review' },
  { value: 'update_payment_settings', label: 'Update Payment Settings' },
  { value: 'create_payment_method', label: 'Create Payment Method' },
  { value: 'update_payment_method', label: 'Update Payment Method' },
  { value: 'delete_payment_method', label: 'Delete Payment Method' },
  { value: 'toggle_payment_method', label: 'Toggle Payment Method' },
  { value: 'delete_payment_qr', label: 'Delete Payment QR' },
];

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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [quotaData, setQuotaData] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [dashStats, setDashStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [claimRequests, setClaimRequests] = useState([]);
  const [claimActionLoading, setClaimActionLoading] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Raast QR Payment Gateway Settings & Payment Methods
  // Reports State
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportsFetched, setReportsFetched] = useState(false);

  // Delete Payment Method Confirmation Modal State
  const [deleteMethodTarget, setDeleteMethodTarget] = useState(null);
  const [deleteMethodAcknowledged, setDeleteMethodAcknowledged] = useState(false);
  const [isDeletingMethod, setIsDeletingMethod] = useState(false);

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

  // Users Tab Search State
  const [userSearch, setUserSearch] = useState('');

  // Admin Edit Business State
  const [editingBusiness, setEditingBusiness] = useState(null);

  // Bank App Verification Checkbox
  const [verifiedInBankApp, setVerifiedInBankApp] = useState(false);

  // Make Admin Confirmation Dialog State
  const [makeAdminTarget, setMakeAdminTarget] = useState(null);
  const [isPromotingAdmin, setIsPromotingAdmin] = useState(false);

  // Delete User Confirmation Dialog State
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteUserAcknowledged, setDeleteUserAcknowledged] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Spam Confirmation Dialog State
  const [spamTarget, setSpamTarget] = useState(null);
  const [spamReason, setSpamReason] = useState('');
  const [isSpamSubmitting, setIsSpamSubmitting] = useState(false);
  const [unspamLoadingId, setUnspamLoadingId] = useState(null);

  // Emails Tab State
  const [emailStats, setEmailStats] = useState({ total: 0, today: 0 });
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState('');

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityActionFilter, setActivityActionFilter] = useState('');

  // Backup Export State
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [userPickerResults, setUserPickerResults] = useState([]);
  const [userPickerLoading, setUserPickerLoading] = useState(false);

  // Close user picker on Escape key
  useEffect(() => {
    if (!userPickerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserPickerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userPickerOpen]);

  // Fetch users for user picker dropdown
  useEffect(() => {
    if (!userPickerOpen) return;
    let active = true;
    setUserPickerLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await adminAPI.getUsers({
          search: userPickerSearch.trim() || undefined,
          limit: 8,
        });
        if (active) {
          setUserPickerResults(res.data?.users || []);
        }
      } catch {
        if (active) setUserPickerResults([]);
      } finally {
        if (active) setUserPickerLoading(false);
      }
    }, userPickerSearch ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [userPickerOpen, userPickerSearch]);

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

  // Close Delete User confirmation dialog on Escape key
  useEffect(() => {
    if (!deleteUserTarget) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeletingUser) {
        setDeleteUserTarget(null);
        setDeleteUserAcknowledged(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteUserTarget, isDeletingUser]);

  // Close Spam confirmation dialog on Escape key
  useEffect(() => {
    if (!spamTarget) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSpamSubmitting) {
        setSpamTarget(null);
        setSpamReason('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spamTarget, isSpamSubmitting]);

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
      list.push({ id: 'payments', label: 'Payment History' });
    }
    if (isSuperAdmin || perms.canModerateReviews) {
      list.push({ id: 'reviews', label: 'Reviews', badge: dashStats?.totalReviews });
    }
    if (isSuperAdmin || perms.canApproveListings) {
      const pendingClaimsCount = claimRequests.filter((c) => c.status === 'pending_admin').length;
      list.push({
        id: 'claims',
        label: 'Claim Requests',
        badge: pendingClaimsCount > 0 ? pendingClaimsCount : (claimRequests.length > 0 ? claimRequests.length : undefined),
        badgeClass: pendingClaimsCount > 0 ? 'badge-yellow' : undefined,
      });
    }
    if (isSuperAdmin) {
      list.push({ id: 'users', label: 'Users' });
      list.push({ id: 'emails', label: 'Emails' });
      list.push({ id: 'activity', label: 'Activity' });
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
    claimRequests,
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

      setQuotaLoading(true);
      adminAPI.getQuota()
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setQuotaData(res.data.data);
          }
        })
        .catch(() => {})
        .finally(() => setQuotaLoading(false));
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
        const res = await adminAPI.getUsers({
          page,
          limit: 10,
          search: userSearch,
        });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else if (tab === 'emails') {
        if (!isSuperAdmin) return;
        const [statsRes, logsRes] = await Promise.all([
          adminAPI.getEmailStats(),
          adminAPI.getEmailLog({ page, limit: 20 }),
        ]);
        const statsData = statsRes.data?.data || statsRes.data || {};
        setEmailStats({
          total: typeof statsData.total === 'number' ? statsData.total : 0,
          today: typeof statsData.today === 'number' ? statsData.today : 0,
        });
        const logsData = logsRes.data?.data || logsRes.data || {};
        setEmailLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
        setPagination(logsData.pagination || null);
      } else if (tab === 'activity') {
        if (!isSuperAdmin) return;
        const res = await adminAPI.getActivityLog({
          page,
          limit: 20,
          action: activityActionFilter || undefined,
        });
        const data = res.data?.data || res.data || {};
        setActivityLogs(Array.isArray(data.logs) ? data.logs : (Array.isArray(data.activityLogs) ? data.activityLogs : []));
        setPagination(data.pagination || null);
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
      } else if (tab === 'claims') {
        if (!isSuperAdmin && !perms.canApproveListings) return;
        const res = await adminAPI.getClaims();
        setClaimRequests(res.data?.claims || []);
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
    userSearch,
    reviewSearch,
    paymentStatusFilter,
    paymentSearch,
    activityActionFilter,
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

  const handleOpenSpamModal = (biz) => {
    if (!biz.owner) {
      toast.error('Listing has no associated owner.');
      return;
    }
    setSpamTarget({
      user: biz.owner,
      business: biz,
    });
    setSpamReason('');
  };

  const handleConfirmSpam = async () => {
    if (!spamTarget?.user?._id) return;
    const trimmed = spamReason.trim();
    if (!trimmed) {
      toast.error('Please enter a reason for flagging this account.');
      return;
    }
    if (trimmed.length > 200) {
      toast.error('Reason must be at most 200 characters.');
      return;
    }
    setIsSpamSubmitting(true);
    try {
      const targetUserId = spamTarget.user._id;
      await adminAPI.spamUser(targetUserId, trimmed);
      setBusinesses((prev) =>
        prev.map((b) => {
          const ownerId = b.owner?._id || b.owner;
          if (ownerId === targetUserId) {
            return {
              ...b,
              owner: typeof b.owner === 'object'
                ? { ...b.owner, isSpam: true, spamReason: trimmed, spamAt: new Date().toISOString() }
                : b.owner,
            };
          }
          return b;
        })
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUserId
            ? { ...u, isSpam: true, spamReason: trimmed, spamAt: new Date().toISOString() }
            : u
        )
      );
      toast.success('User flagged as spam.');
      setSpamTarget(null);
      setSpamReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to flag user as spam.');
    } finally {
      setIsSpamSubmitting(false);
    }
  };

  const handleUnspamUser = async (biz) => {
    const targetUserId = biz.owner?._id || biz.owner;
    if (!targetUserId) {
      toast.error('Listing has no associated owner.');
      return;
    }
    setUnspamLoadingId(targetUserId);
    try {
      await adminAPI.unspamUser(targetUserId);
      setBusinesses((prev) =>
        prev.map((b) => {
          const ownerId = b.owner?._id || b.owner;
          if (ownerId === targetUserId) {
            return {
              ...b,
              owner: typeof b.owner === 'object'
                ? { ...b.owner, isSpam: false, spamReason: '', spamAt: null }
                : b.owner,
            };
          }
          return b;
        })
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUserId
            ? { ...u, isSpam: false, spamReason: '', spamAt: null }
            : u
        )
      );
      toast.success('User un-flagged successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to un-flag user.');
    } finally {
      setUnspamLoadingId(null);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const to = emailForm.to.trim();
    const subject = emailForm.subject.trim();
    const message = emailForm.message.trim();

    if (!to || !subject || !message) {
      toast.error('Recipient, subject, and message are all required.');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await adminAPI.sendAdminEmail({ to, subject, message });
      toast.success(res.data?.message || 'Email sent successfully.');
      setEmailForm({ to: '', subject: '', message: '' });
      setUserPickerOpen(false);
      setUserPickerSearch('');
      if (page === 1) {
        loadTabData();
      } else {
        setPage(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send email.');
    } finally {
      setSendingEmail(false);
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

  const handleDeleteUser = (userOrId, name) => {
    if (userOrId && typeof userOrId === 'object') {
      setDeleteUserTarget(userOrId);
    } else {
      const found = users.find((x) => x._id === userOrId) || { _id: userOrId, name: name || 'User' };
      setDeleteUserTarget(found);
    }
    setDeleteUserAcknowledged(false);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget || !deleteUserAcknowledged || isDeletingUser) return;
    const targetId = deleteUserTarget._id;
    setIsDeletingUser(true);
    try {
      await adminAPI.deleteUser(targetId);
      setUsers((prev) => prev.filter((u) => u._id !== targetId));
      toast.success('User deleted.');
      setDeleteUserTarget(null);
      setDeleteUserAcknowledged(false);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setIsDeletingUser(false);
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

  const handleApproveClaim = async (claim) => {
    if (
      !confirm(
        `Are you sure you want to APPROVE the claim for "${claim.business?.title || 'this business'}"?\n\nThis will transfer ownership to ${claim.chosenEmail}.`
      )
    ) {
      return;
    }

    setClaimActionLoading((prev) => ({ ...prev, [claim._id]: 'approve' }));
    try {
      const res = await adminAPI.approveClaim(claim._id);
      toast.success(res.data?.message || 'Claim approved successfully!');
      setClaimRequests((prev) =>
        prev.map((c) => (c._id === claim._id ? { ...c, status: 'approved' } : c))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to approve claim.');
    } finally {
      setClaimActionLoading((prev) => ({ ...prev, [claim._id]: null }));
    }
  };

  const handleRejectClaim = async (claim) => {
    if (
      !confirm(
        `Are you sure you want to REJECT the claim for "${claim.business?.title || 'this business'}"?`
      )
    ) {
      return;
    }

    setClaimActionLoading((prev) => ({ ...prev, [claim._id]: 'reject' }));
    try {
      const res = await adminAPI.rejectClaim(claim._id);
      toast.success(res.data?.message || 'Claim rejected.');
      setClaimRequests((prev) =>
        prev.map((c) => (c._id === claim._id ? { ...c, status: 'rejected' } : c))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to reject claim.');
    } finally {
      setClaimActionLoading((prev) => ({ ...prev, [claim._id]: null }));
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

  const handleDeleteMethod = (methodId, methodName) => {
    setDeleteMethodTarget({ id: methodId, name: methodName || 'this' });
    setDeleteMethodAcknowledged(false);
  };

  const handleConfirmDeleteMethod = async () => {
    if (!deleteMethodTarget?.id) return;
    setIsDeletingMethod(true);
    try {
      await adminAPI.deletePaymentMethod(deleteMethodTarget.id);
      setPaymentConfig((prev) => ({
        ...prev,
        paymentMethods: (prev.paymentMethods || []).filter((m) => m._id !== deleteMethodTarget.id),
      }));
      toast.success('Payment method deleted successfully.');
      setDeleteMethodTarget(null);
      setDeleteMethodAcknowledged(false);
    } catch (err) {
      toast.error(err.message || 'Failed to delete payment method.');
    } finally {
      setIsDeletingMethod(false);
    }
  };

  // Payments View Handlers / Aliases
  const handleQrUpload = handleQrCodeFileChange;
  const handleRemoveQr = handleDeleteQrCode;
  const handleEditMethod = handleOpenEditMethod;

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

  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  const handleUpdatePaymentStatus = async (bizId, status) => {
    if (!isSuperAdmin) {
      toast.error('Only the main admin can verify or reject payments.');
      return;
    }
    setUpdatingPaymentStatus(true);
    try {
      const res = await adminAPI.updatePaymentStatus(bizId, status);
      setPayments((prev) =>
        prev.map((p) =>
          p._id === bizId ? { ...p, paymentStatus: status } : p
        )
      );
      setBusinesses((prev) =>
        prev.map((b) =>
          b._id === bizId ? { ...b, paymentStatus: status } : b
        )
      );
      if (selectedReceiptBiz?._id === bizId) {
        setSelectedReceiptBiz((prev) => (prev ? { ...prev, paymentStatus: status } : null));
      }
      toast.success(res.message || `Payment status marked as ${status}.`);
    } catch (err) {
      toast.error(err.message || `Failed to update payment status to ${status}.`);
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  // Download full database backup
  const handleDownloadBackup = async () => {
    if (!isSuperAdmin) return;
    setIsExportingBackup(true);
    try {
      await adminAPI.exportBackup();
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to download backup.');
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Load real reports data
  const loadReports = useCallback(async () => {
    if (!isSuperAdmin) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const res = await adminAPI.getReports();
      const data = res?.data?.data || res?.data || {};
      setReportsData(data);
      setReportsFetched(true);
    } catch (err) {
      setReportsError(err.message || 'Failed to load reports.');
      toast.error(err.message || 'Failed to load reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [isSuperAdmin]);

  // Fetch reports on first open
  useEffect(() => {
    if (activeSection === 'reports' && !reportsFetched && isSuperAdmin) {
      loadReports();
    }
  }, [activeSection, reportsFetched, isSuperAdmin, loadReports]);

  // Load payments data when navigating to payments section if empty
  useEffect(() => {
    if (activeSection === 'payments' && isSuperAdmin && payments.length === 0) {
      adminAPI.getPaymentHistory({ page: 1, limit: 50 })
        .then((res) => {
          setPayments(res.data?.payments || []);
        })
        .catch(() => {});
    }
  }, [activeSection, isSuperAdmin, payments.length]);

  // Validate activeSection against valid sections
  useEffect(() => {
    const validSections = ['dashboard', 'payments', 'reports', 'settings'];
    if (activeSection && !validSections.includes(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [activeSection]);

  const handleSelectSection = (section, targetTab) => {
    const validSections = ['dashboard', 'payments', 'reports', 'settings'];
    let safeSection = validSections.includes(section) ? section : 'dashboard';
    if (section === 'payments' || targetTab === 'payments') {
      safeSection = 'payments';
    }
    setActiveSection(safeSection);
    if (targetTab) {
      setTab(targetTab);
      setPage(1);
    }
  };

  const handleSearchUserSelect = (selectedUser) => {
    setActiveSection('dashboard');
    setTab('users');
    setPage(1);
    setUserSearch(selectedUser.name || selectedUser.email);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  // ─── Real Payments Operations Section Renderers (Piece 2) ───────────────────
  const renderPaymentMasterToggleCard = () => (
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
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <QrCode size={20} style={{ color: paymentConfig.isEnabled ? '#15803d' : '#6b7280' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
              Directory Listing Payment Requirement
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
              ? 'Currently ON: Users must complete payment according to their country fee and submit proof/receipt to submit or verify their listing.'
              : 'Currently OFF: Business submissions are 100% FREE. No payment or receipt screenshot is required.'}
          </p>
        </div>

        {/* Big ON / OFF Toggle Button */}
        <button
          type="button"
          onClick={handleTogglePaymentEnabled}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow transition-all hover:scale-102 shrink-0 cursor-pointer min-h-[44px]"
          style={{
            background: paymentConfig.isEnabled ? '#16a34a' : '#4b5563',
            color: '#ffffff',
            border: 'none',
          }}
          title="Click to toggle Payment requirement ON or OFF"
        >
          <span
            className={`w-3 h-3 rounded-full ${paymentConfig.isEnabled ? 'bg-white animate-pulse' : 'bg-gray-300'}`}
          />
          {paymentConfig.isEnabled ? 'Turn Payment OFF' : 'Turn Payment ON'}
        </button>
      </div>

      {/* Standing Rule Note */}
      <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Standing Rule Note:</strong> Payments stay OFF until sir says so — the toggle only reflects/changes the real setting, it never auto-enables anything.
        </span>
      </div>
    </div>
  );

  const renderCountryFeesCard = () => (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
            Listing Fee per Country
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            Set the business listing fee for each country. Currencies are fixed server-side. Amount 0 = <strong>FREE listing</strong> for that country.
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
                    placeholder={placeholder}
                    className="form-input pl-12 text-sm font-semibold"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {currency}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRaastQrGatewayCard = () => (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-emerald-600" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
              Raast QR Gateway Configuration
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
            Instant QR payment receiver for Pakistani banks and digital wallets.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={paymentConfig.qrEnabled !== false}
            onChange={(e) => setPaymentConfig({ ...paymentConfig, qrEnabled: e.target.checked })}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold text-gray-800 select-none">Enable Raast QR</span>
        </label>
      </div>

      {/* QR Code Upload / Preview */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-700">Raast QR Code Image</label>
        {qrCodePreview || paymentConfig.qrCode?.url ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-300 bg-white shadow-xs shrink-0">
              <img
                src={qrCodePreview || paymentConfig.qrCode?.url}
                alt="Raast QR Code"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">
                {qrCodeFile ? 'New QR file selected (ready to save)' : 'Active Raast QR on Cloudinary'}
              </p>
              <p className="text-[11px] text-gray-500">
                Ensure this is the official static merchant/personal QR code generated from your banking app.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="btn-secondary text-xs px-3 py-1.5 font-semibold cursor-pointer inline-flex items-center gap-1.5">
                  <Upload size={13} /> Change QR
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                  />
                </label>
                {paymentConfig.qrCode?.url && (
                  <button
                    type="button"
                    onClick={handleRemoveQr}
                    disabled={deletingQrCode}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={13} /> {deletingQrCode ? 'Deleting…' : 'Delete QR'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 group-hover:border-emerald-300 transition-colors shadow-2xs mb-2">
              <Upload size={22} />
            </div>
            <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-600">
              Click to upload Raast QR Code image
            </span>
            <span className="text-[11px] text-gray-400 mt-1">PNG, JPG or WebP up to 5MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleQrUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Raast QR Details Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Account / Merchant Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentConfig.accountTitle || ''}
            onChange={(e) => setPaymentConfig({ ...paymentConfig, accountTitle: e.target.value })}
            placeholder="e.g. BizPrimeHub"
            className="form-input text-xs sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Bank / Wallet Name
          </label>
          <input
            type="text"
            value={paymentConfig.bankName || ''}
            onChange={(e) => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
            placeholder="e.g. Raast Instant Payment / HBL"
            className="form-input text-xs sm:text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Raast ID / IBAN / Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={paymentConfig.raastId || ''}
            onChange={(e) => setPaymentConfig({ ...paymentConfig, raastId: e.target.value })}
            placeholder="e.g. PK00RAAST0123456789012345 or mobile number"
            className="form-input text-xs sm:text-sm font-mono"
          />
        </div>
      </div>

      {/* Countries where Raast QR is shown */}
      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
        <label className="block text-xs font-bold text-gray-700">
          Countries Showing Raast QR Gateway:
        </label>
        <div className="flex items-center gap-4 flex-wrap">
          {['Pakistan', 'UAE', 'USA'].map((c) => {
            const isChecked = (paymentConfig.qrCountries || ['Pakistan']).includes(c);
            return (
              <label key={c} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const current = paymentConfig.qrCountries || ['Pakistan'];
                    const next = e.target.checked
                      ? [...new Set([...current, c])]
                      : current.filter((x) => x !== c);
                    setPaymentConfig({ ...paymentConfig, qrCountries: next.length > 0 ? next : ['Pakistan'] });
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPaymentMethodsCard = () => (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
              Custom Payment Methods & Bank Accounts
            </h3>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {paymentConfig.paymentMethods?.length || 0}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
            Add branded bank cards (Meezan, SadaPay, NayaPay, JazzCash, EasyPaisa, etc.) with custom IBAN/number details.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddMethod}
          className="btn-secondary text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1.5 cursor-pointer min-h-[38px]"
        >
          <Plus size={14} /> Add Payment Method
        </button>
      </div>

      {(!paymentConfig.paymentMethods || paymentConfig.paymentMethods.length === 0) ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <CreditCard size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">No custom payment methods configured yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Click &ldquo;Add Payment Method&rdquo; above to add bank account or wallet cards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentConfig.paymentMethods.map((method) => {
            const isToggling = togglingMethodId === method._id;

            return (
              <div
                key={method._id}
                className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3"
              >
                {/* Method Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {method.cardImage?.url ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img
                          src={method.cardImage.url}
                          alt={method.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {method.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{method.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {method.kind === 'iban' ? 'IBAN Account' : 'Account Number'}
                      </span>
                    </div>
                  </div>

                  {/* Active / Inactive Badge */}
                  <span
                    className={`badge ${method.isEnabled ? 'badge-green' : 'badge-gray'}`}
                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                  >
                    {method.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {/* Account Details */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Title:</span>
                    <strong className="text-gray-900">{method.accountTitle}</strong>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 font-mono text-[11px]">
                    <span>{method.kind === 'iban' ? 'IBAN:' : 'Number:'}</span>
                    <strong className="text-gray-900 break-all select-all">{method.accountValue}</strong>
                  </div>
                  {method.details && (
                    <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 line-clamp-2">
                      {method.details}
                    </p>
                  )}
                </div>

                {/* Country Badges */}
                <div className="flex items-center gap-1 flex-wrap">
                  {(method.countries || ['Pakistan']).map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Actions: Edit, Toggle, Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleMethod(method._id)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer min-h-[32px] flex items-center gap-1 ${
                      method.isEnabled
                        ? 'text-gray-600 hover:bg-gray-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {method.isEnabled ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditMethod(method)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Edit method details"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMethod(method._id, method.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete payment method"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPaymentInstructionsCard = () => (
    <div className="card p-5 space-y-3">
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
        Payment Instructions for Users
      </h3>
      <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
        These instructions are displayed to users on the submission and claim verification pages.
      </p>
      <textarea
        rows={3}
        value={paymentConfig.instructions || ''}
        onChange={(e) => setPaymentConfig({ ...paymentConfig, instructions: e.target.value })}
        className="form-input text-xs sm:text-sm leading-relaxed"
        placeholder="Enter payment instructions for users..."
      />
    </div>
  );

  const renderOwnerNotificationsCard = () => (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
              Admin & Owner Email Notifications
            </h3>
            <span
              className={`badge ${paymentConfig.ownerNotificationsEnabled ? 'badge-blue' : 'badge-gray'}`}
              style={{ fontSize: '0.65rem', padding: '2px 6px' }}
            >
              {paymentConfig.ownerNotificationsEnabled ? 'ACTIVE / ON' : 'PAUSED / OFF'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
            Receive automated alert emails whenever a user submits a new business listing or uploads a payment receipt.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleOwnerNotifications}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5"
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

      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={paymentConfig.ownerNotificationsEnabled !== false}
            onChange={(e) =>
              setPaymentConfig({
                ...paymentConfig,
                ownerNotificationsEnabled: e.target.checked,
              })
            }
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-bold text-gray-800 select-none">
            Send email notifications for new business submissions & payment receipts
          </span>
        </label>

        <div>
          <label htmlFor="ownerNotificationEmail" className="block text-xs font-bold text-gray-700 mb-1">
            Notification Recipient Email Address
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
            className="form-input text-xs sm:text-sm font-mono sm:font-sans"
            placeholder="Enter notification recipient email address"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Initial value loaded from server payment settings. If empty or disabled, notification emails will be skipped.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPaymentStatsRow = () => {
    const methodsActive = paymentConfig.paymentMethods?.filter((m) => m.isEnabled).length || 0;
    const receiptsPending = payments.filter((p) => p.paymentStatus === 'pending').length;
    const receiptsVerified = payments.filter((p) => p.paymentStatus === 'verified').length;
    const receiptsRejected = payments.filter((p) => p.paymentStatus === 'rejected').length;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Active Methods"
          value={methodsActive}
          icon={CreditCard}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatCard
          label="Receipts Pending"
          value={receiptsPending}
          icon={Clock}
          color="#d97706"
          bg="#fffbeb"
        />
        <StatCard
          label="Receipts Verified"
          value={receiptsVerified}
          icon={CheckCircle2}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          label="Receipts Rejected"
          value={receiptsRejected}
          icon={X}
          color="#dc2626"
          bg="#fef2f2"
        />
      </div>
    );
  };

  const renderReceiptVerificationQueue = () => (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
              Receipt Verification Queue
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '2px' }}>
            Review incoming payment screenshots and approve or reject submissions.
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <CreditCard size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">No payment records found</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Incoming listing payments and uploaded receipts will appear here for verification.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/70 hover:border-gray-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-900 truncate">
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
                    style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                  >
                    Payment: {p.paymentStatus || 'pending'}
                  </span>
                  <span
                    className={`badge ${p.isApproved ? 'badge-green' : 'badge-yellow'}`}
                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                  >
                    Listing: {p.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="font-bold text-gray-900">
                    Amount: Rs. {p.paymentAmount || 0}
                  </span>
                  {p.owner && (
                    <span>
                      Owner: <strong className="text-gray-700">{p.owner.name}</strong> ({p.owner.email})
                    </span>
                  )}
                  <span>
                    Date: {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-3 sm:pt-0 border-t border-gray-200/80 sm:border-0 w-full sm:w-auto justify-start sm:justify-end">
                {isSuperAdmin && p.paymentStatus !== 'verified' && (
                  <button
                    type="button"
                    disabled={updatingPaymentStatus}
                    onClick={() => handleUpdatePaymentStatus(p._id, 'verified')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-300 cursor-pointer min-h-[36px]"
                    title="Verify Payment Receipt"
                  >
                    <Check size={13} /> Verify
                  </button>
                )}
                {isSuperAdmin && p.paymentStatus !== 'rejected' && (
                  <button
                    type="button"
                    disabled={updatingPaymentStatus}
                    onClick={() => handleUpdatePaymentStatus(p._id, 'rejected')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-300 cursor-pointer min-h-[36px]"
                    title="Reject Payment Receipt"
                  >
                    <X size={13} /> Reject
                  </button>
                )}
                {p.paymentReceipt?.url && (
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptBiz(p)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer min-h-[36px]"
                    title="View Receipt Screenshot"
                  >
                    <Eye size={13} /> View Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentsView = () => (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Payments Operations</h1>
            <p className="text-xs sm:text-sm text-gray-500">Live gateway status, per-country fees, payment accounts, and receipt approvals</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer min-h-[44px] px-3 py-2 flex items-center"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Payment Stats Row */}
      {renderPaymentStatsRow()}

      {/* Master Toggle Banner with Standing Rule */}
      {renderPaymentMasterToggleCard()}

      {/* Settings Form: Fees + Raast QR + Payment Methods + Instructions */}
      <form onSubmit={handleSavePaymentSettings} className="space-y-6">
        {renderCountryFeesCard()}
        {renderRaastQrGatewayCard()}
        {renderPaymentMethodsCard()}
        {renderPaymentInstructionsCard()}
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

      {/* Receipt Verification Queue */}
      {renderReceiptVerificationQueue()}
    </div>
  );

  // ─── Real Settings & Controls Section Renderer (Piece Settings) ─────────────
  const renderSettingsView = () => (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Settings & Controls</h1>
            <p className="text-xs sm:text-sm text-gray-500">Website payment configuration, automated notifications, database backups, and administrative tools</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer min-h-[44px] px-3 py-2 flex items-center"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Master Toggle Banner */}
      {renderPaymentMasterToggleCard()}

      {/* Website Settings Form */}
      <form onSubmit={handleSavePaymentSettings} className="space-y-6">
        {renderCountryFeesCard()}
        {renderRaastQrGatewayCard()}
        {renderPaymentMethodsCard()}
        {renderOwnerNotificationsCard()}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={savingPaymentConfig}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold shadow"
          >
            <Save size={16} />
            {savingPaymentConfig ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Admin Panel Tools Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Admin Panel Tools</h2>

        {/* (6) Backup Database Card */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Database Backup & Export</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Download a complete JSON backup archive of all directory data (businesses, users, reviews) with passwords and secrets stripped.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Download size={16} />
                <span>{isExportingBackup ? 'Preparing backup…' : 'Download Backup'}</span>
              </button>
            </div>
          </div>
        )}

        {/* (7) Shortcuts to Emails and Activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={18} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Email Center</h3>
              </div>
              <p className="text-xs text-gray-500">
                Send administrative emails to business owners, monitor sent logs, and review daily email limits.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectSection('dashboard', 'emails')}
              className="btn-secondary text-xs font-semibold py-2 px-3 text-center self-start"
            >
              Open Email Center &rarr;
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={18} className="text-cyan-600" />
                <h3 className="text-sm font-bold text-gray-900">Admin Activity Log</h3>
              </div>
              <p className="text-xs text-gray-500">
                Inspect the audit trail of approvals, rejections, user roles, permission edits, and payment verifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectSection('dashboard', 'activity')}
              className="btn-secondary text-xs font-semibold py-2 px-3 text-center self-start"
            >
              Open Activity Log &rarr;
            </button>
          </div>
        </div>

        {/* (8) Sign Out Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Admin Account Session</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Securely sign out of your administrative session on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl min-h-[44px] cursor-pointer transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // ─── Real Reports & Analytics Section Renderer (Piece Reports) ─────────────
  const renderReportsView = () => (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-xs sm:text-sm text-gray-500">Live platform totals, category performance, city coverage, and trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadReports}
            disabled={reportsLoading}
            className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2 font-semibold cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} />
            <span>{reportsLoading ? 'Refreshing…' : 'Refetch Data'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer min-h-[40px] px-3 py-2 flex items-center"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {reportsError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-900">{reportsError}</p>
          <button
            type="button"
            onClick={loadReports}
            className="btn-primary mt-4 text-xs px-4 py-2"
          >
            Try Again
          </button>
        </div>
      ) : reportsLoading && !reportsData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
          <p className="text-sm text-gray-500">Loading platform reports & analytics...</p>
        </div>
      ) : reportsData ? (
        <>
          {/* 7 StatCards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <StatCard
              label="Total Users"
              value={reportsData.totals?.users?.toLocaleString() ?? 0}
              icon={Users}
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              label="Businesses"
              value={reportsData.totals?.businesses?.toLocaleString() ?? 0}
              icon={Building2}
              color="#0891b2"
              bg="#ecfeff"
            />
            <StatCard
              label="Pending"
              value={reportsData.totals?.pending?.toLocaleString() ?? 0}
              icon={Clock}
              color="#d97706"
              bg="#fffbeb"
            />
            <StatCard
              label="Approved"
              value={reportsData.totals?.approved?.toLocaleString() ?? 0}
              icon={CheckCircle2}
              color="#059669"
              bg="#ecfdf5"
            />
            <StatCard
              label="Spam Hidden"
              value={reportsData.totals?.hiddenBySpam?.toLocaleString() ?? 0}
              icon={AlertTriangle}
              color="#dc2626"
              bg="#fef2f2"
            />
            <StatCard
              label="Total Reviews"
              value={reportsData.totals?.reviews?.toLocaleString() ?? 0}
              icon={Star}
              color="#ec4899"
              bg="#fdf2f8"
            />
            <StatCard
              label="Avg Rating"
              value={reportsData.reviews?.avgRating != null ? `${reportsData.reviews.avgRating} / 5` : '0 / 5'}
              icon={Star}
              color="#8b5cf6"
              bg="#f5f3ff"
            />
          </div>

          {/* Breakdown Grid: CSS Progress Bars (NO Chart Library) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Category Distribution (CSS Bars) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">By Category</h3>
                <span className="text-xs font-semibold text-gray-400">
                  {reportsData.byCategory?.length || 0} total
                </span>
              </div>
              {(!reportsData.byCategory || reportsData.byCategory.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-auto pr-1">
                  {(() => {
                    const maxCount = Math.max(...reportsData.byCategory.map((c) => c.count), 1);
                    return reportsData.byCategory.map((cat) => {
                      const pct = Math.round((cat.count / maxCount) * 100);
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700 truncate pr-2">{cat.name}</span>
                            <span className="font-bold text-gray-900 shrink-0">{cat.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Countries Bar Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">By Country</h3>
                <span className="text-xs font-semibold text-gray-400">Coverage</span>
              </div>
              {(!reportsData.byCountry || reportsData.byCountry.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const maxCount = Math.max(...reportsData.byCountry.map((c) => c.count), 1);
                    return reportsData.byCountry.map((cnt) => {
                      const pct = Math.round((cnt.count / maxCount) * 100);
                      return (
                        <div key={cnt.name} className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-800">{cnt.name}</span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {cnt.count} businesses
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Top 10 Cities Bar Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Top 10 Cities</h3>
                <span className="text-xs font-semibold text-gray-400">Leaderboard</span>
              </div>
              {(!reportsData.topCities || reportsData.topCities.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-auto pr-1">
                  {(() => {
                    const maxCount = Math.max(...reportsData.topCities.map((c) => c.count), 1);
                    return reportsData.topCities.map((city, idx) => {
                      const pct = Math.round((city.count / maxCount) * 100);
                      return (
                        <div key={city.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700 truncate pr-2">
                              <strong className="text-gray-400 mr-1.5">#{idx + 1}</strong>
                              {city.name}
                            </span>
                            <span className="font-bold text-gray-900 shrink-0">{city.count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Month-wise Tables Grid (Last 12 Months) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Businesses by Month */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Businesses by Month (Last 12 Months)</h3>
                <span className="text-xs font-semibold text-gray-400">Timeline</span>
              </div>
              {(!reportsData.businessesByMonth || reportsData.businessesByMonth.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="pb-2.5">Month</th>
                        <th className="pb-2.5 text-right">New Listings</th>
                        <th className="pb-2.5 pl-4">Distribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const maxB = Math.max(...reportsData.businessesByMonth.map((m) => m.count), 1);
                        return reportsData.businessesByMonth.map((m) => (
                          <tr key={m.month} className="hover:bg-gray-50/70">
                            <td className="py-2.5 font-semibold text-gray-800">{m.month}</td>
                            <td className="py-2.5 text-right font-bold text-gray-900">{m.count}</td>
                            <td className="py-2.5 pl-4 w-1/2">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.round((m.count / maxB) * 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Users by Month */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Users Registered by Month (Last 12 Months)</h3>
                <span className="text-xs font-semibold text-gray-400">Growth</span>
              </div>
              {(!reportsData.usersByMonth || reportsData.usersByMonth.length === 0) ? (
                <p className="text-xs text-gray-400 py-6 text-center">No data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="pb-2.5">Month</th>
                        <th className="pb-2.5 text-right">New Users</th>
                        <th className="pb-2.5 pl-4">Distribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const maxU = Math.max(...reportsData.usersByMonth.map((m) => m.count), 1);
                        return reportsData.usersByMonth.map((m) => (
                          <tr key={m.month} className="hover:bg-gray-50/70">
                            <td className="py-2.5 font-semibold text-gray-800">{m.month}</td>
                            <td className="py-2.5 text-right font-bold text-gray-900">{m.count}</td>
                            <td className="py-2.5 pl-4 w-1/2">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.round((m.count / maxU) * 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Summary Blocks: Payments + Pending Aging + Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Payments Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Payments & Receipts</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Receipts Uploaded:</span>
                  <strong className="text-gray-900">{reportsData.payments?.totalReceipts ?? 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Verified Receipts:</span>
                  <strong className="text-emerald-600">{reportsData.payments?.byStatus?.verified ?? 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Pending Receipts:</span>
                  <strong className="text-amber-600">{reportsData.payments?.byStatus?.pending ?? 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Rejected Receipts:</span>
                  <strong className="text-rose-600">{reportsData.payments?.byStatus?.rejected ?? 0}</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-gray-700">Verified Sum Collected:</span>
                  <strong className="font-bold text-emerald-700">
                    Rs. {(reportsData.payments?.verifiedAmount ?? 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pending Listings Aging Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock size={18} />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Pending Listings Aging</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Waiting &gt; 7 Days:</span>
                  <strong className="text-rose-600 font-bold">
                    {reportsData.pendingAging?.waitingOver7Days ?? 0}
                  </strong>
                </div>
                <div className="py-1 border-b border-gray-50">
                  <span className="text-gray-500 block mb-0.5">Oldest Submission Date:</span>
                  <strong className="text-gray-900">
                    {reportsData.pendingAging?.oldestPendingDate
                      ? new Date(reportsData.pendingAging.oldestPendingDate).toLocaleDateString()
                      : 'No pending submissions'}
                  </strong>
                </div>
                <div className="py-1">
                  <span className="text-gray-500 block mb-0.5">Oldest Listing Title:</span>
                  <p className="font-semibold text-gray-800 truncate">
                    {reportsData.pendingAging?.oldestPendingTitle || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                  <Star size={18} />
                </div>
                <h3 className="font-bold text-sm text-gray-900">Reviews & Ratings</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Total Reviews:</span>
                  <strong className="text-gray-900">{reportsData.reviews?.total ?? 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Overall Avg Rating:</span>
                  <strong className="text-amber-600 font-bold">
                    {reportsData.reviews?.avgRating != null ? `${reportsData.reviews.avgRating} / 5.0` : '0 / 5.0'}
                  </strong>
                </div>
                <div className="pt-2 text-gray-400 text-[11px] leading-relaxed">
                  Calculated across all customer reviews and ratings submitted for directory businesses.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
          <p className="text-sm text-gray-400">No data yet</p>
        </div>
      )}
    </div>
  );

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  if (authLoading || (!isSuperAdmin && !isSubAdmin && !authLoading)) {
    return <div className="section container-max text-center"><p style={{ color: '#6b7280' }}>Loading...</p></div>;
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#f8fafc] flex flex-col lg:flex-row overflow-hidden text-gray-900">
      {/* Desktop Fixed Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        activeTab={tab}
        onSelectSection={handleSelectSection}
        dashStats={dashStats}
        tabs={tabs}
      />

      {/* Mobile / Tablet Drawer Sidebar */}
      <AdminSidebar
        isMobileDrawer={true}
        isOpen={sidebarDrawerOpen}
        onClose={() => setSidebarDrawerOpen(false)}
        activeSection={activeSection}
        activeTab={tab}
        onSelectSection={handleSelectSection}
        dashStats={dashStats}
        tabs={tabs}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <AdminHeader
          onOpenDrawer={() => setSidebarDrawerOpen(true)}
          dashStats={dashStats}
          onSelectPendingTab={() => {
            setActiveSection('dashboard');
            setTab('pending');
            setPage(1);
          }}
          user={user}
          onLogout={handleLogout}
          onDownloadBackup={handleDownloadBackup}
          isExportingBackup={isExportingBackup}
          onSearchUserSelect={handleSearchUserSelect}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-7 pb-24 lg:pb-8 space-y-5 max-w-full">
          {activeSection === 'dashboard' ? (
            <>
              {/* Greeting & Date Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                    Welcome back, {user?.name || 'Admin'}! 👋
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Manage your business directory, users, payments and more — all in one place.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-200/80 rounded-xl text-xs font-semibold text-gray-600 shadow-2xs self-start sm:self-auto">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{todayFormatted}</span>
                </div>
              </div>

              {/* 5 Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {statsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse shadow-xs" />
                  ))
                ) : (
                  <>
                    <StatCard label="Total Users" value={dashStats?.totalUsers} icon={Users} color="#2563eb" bg="#eff6ff" />
                    <StatCard label="Total Businesses" value={dashStats?.totalBusinesses} icon={Building2} color="#7c3aed" bg="#f5f3ff" />
                    <StatCard label="Pending" value={dashStats?.pendingBusinesses} icon={Clock} color="#d97706" bg="#fffbeb" />
                    <StatCard label="Approved" value={dashStats?.approvedBusinesses} icon={CheckCircle2} color="#059669" bg="#ecfdf5" />
                    <div className="col-span-2 md:col-span-1">
                      <StatCard label="Reviews" value={dashStats?.totalReviews} icon={Star} color="#db2777" bg="#fdf2f8" />
                    </div>
                  </>
                )}
              </div>

              {/* 3 Quota Cards */}
              <AdminQuotaCards
                quota={quotaData || (dashStats?.limits ? { businessCount: dashStats.limits.businesses?.used, mongoDataMB: dashStats.limits.database?.usedMB, cloudinaryCreditsUsed: dashStats.limits.cloudinary?.usedCredits } : null)}
                loading={quotaLoading}
              />

              {/* Tabs Section */}
              {tabs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center my-6 shadow-xs">
                  <Shield size={48} className="mx-auto text-amber-500 mb-3" />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Sub-Admin (No Permissions Assigned)</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    You are logged in as a Sub-Admin, but no permissions (Approve Listings, Delete Listings, Moderate Reviews) have been assigned to your account yet. Please contact the main administrator.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Horizontal Tabs Bar */}
                  <div className="bg-white border border-gray-200/80 rounded-2xl p-1.5 shadow-2xs">
                    <nav
                      className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      aria-label="Dashboard Tabs"
                    >
                      {tabs.map(({ id, label, badge, badgeClass }) => {
                        const isActive = tab === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => { setTab(id); setPage(1); }}
                            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[44px] ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            aria-selected={isActive}
                          >
                            <span>{label}</span>
                            {badge != null && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : badgeClass === 'badge-green'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : badgeClass === 'badge-yellow'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-200 text-gray-800'
                                }`}
                              >
                                {badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Tab Content Panel */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-6">
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
                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                          {/* (a) Receipt thumbnail INLINE */}
                          {biz.paymentReceipt?.url && (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifiedInBankApp(false);
                                setSelectedReceiptBiz(biz);
                              }}
                              className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-emerald-300 hover:ring-2 hover:ring-emerald-500 transition-all cursor-pointer group bg-white shadow-2xs mt-0.5 sm:mt-0"
                              title="Click to view payment receipt screenshot"
                              aria-label="View payment receipt screenshot"
                            >
                              <img
                                src={biz.paymentReceipt.url}
                                alt="Payment receipt"
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </button>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1f2937' }} className="truncate">
                                {biz.title}
                              </p>
                              {biz.isApproved ? (
                                <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Approved</span>
                              ) : (
                                <span className="badge badge-yellow" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Pending</span>
                              )}

                              {/* (d) Waiting-days badge */}
                              {!biz.isApproved && biz.createdAt && (() => {
                                const diffDays = Math.floor((new Date() - new Date(biz.createdAt)) / (1000 * 60 * 60 * 24));
                                if (diffDays < 1) {
                                  return (
                                    <span className="badge badge-blue text-[11px]" title="Submitted within the last 24 hours">
                                      Submitted today
                                    </span>
                                  );
                                }
                                const badgeClass = diffDays >= 7 ? 'badge-red' : diffDays >= 3 ? 'badge-yellow' : 'badge-gray';
                                return (
                                  <span className={`badge ${badgeClass} text-[11px]`} title={`Waiting for review for ${diffDays}d`}>
                                    Waiting {diffDays}d
                                  </span>
                                );
                              })()}
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
                              {biz.owner?.isSpam && (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                                  title={`Owner flagged as spam${biz.owner.spamReason ? `: ${biz.owner.spamReason}` : ''}`}
                                >
                                  <AlertTriangle size={12} /> Spam: {biz.owner.spamReason || 'Flagged'}
                                </span>
                              )}

                              {/* (c) Payment-status badge */}
                              {(() => {
                                const status = (biz.paymentStatus || 'none').toLowerCase();
                                if (status === 'verified') {
                                  return <span className="badge badge-green text-[11px]">Verified</span>;
                                }
                                if (status === 'pending') {
                                  return <span className="badge badge-yellow text-[11px]">Pending</span>;
                                }
                                if (status === 'rejected') {
                                  return <span className="badge badge-red text-[11px]">Rejected</span>;
                                }
                                return <span className="badge badge-gray text-[11px]">none</span>;
                              })()}

                              {/* (e) Payment Receipt Badge with country currency symbol */}
                              {(() => {
                                const country = biz.address?.country || 'Pakistan';
                                const symbol = country === 'UAE' ? 'AED ' : country === 'USA' ? '$' : 'Rs. ';

                                if (biz.paymentReceipt?.url) {
                                  return (
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
                                      {symbol}{biz.paymentAmount || 'Paid'} (View Receipt)
                                    </button>
                                  );
                                }
                                if (Number(biz.paymentAmount) > 0) {
                                  return (
                                    <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                      Fee: {symbol}{biz.paymentAmount} (No Receipt)
                                    </span>
                                  );
                                }
                                return (
                                  <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    Free Listing ({country})
                                  </span>
                                );
                              })()}

                              {/* (b) Expected-fee line */}
                              {paymentConfig.isEnabled && (() => {
                                const country = biz.address?.country || 'Pakistan';
                                const symbol = country === 'UAE' ? 'AED ' : country === 'USA' ? '$' : 'Rs. ';
                                const expectedAmount = paymentConfig.fees?.[country]?.amount ?? (country === 'Pakistan' ? (paymentConfig.feeAmount ?? 50) : 0);

                                return (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}
                                    title={`Configured listing fee for ${country}`}
                                  >
                                    Expected fee: {symbol}{expectedAmount}
                                  </span>
                                );
                              })()}

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
                            const isOwnerSpam = Boolean(biz.owner?.isSpam);
                            const cannotApprove = receiptMissing || isOwnerSpam;

                            return (
                              <button
                                onClick={() => {
                                  if (isOwnerSpam) {
                                    toast.error('Cannot approve: Business owner is flagged as spam!');
                                    return;
                                  }
                                  if (receiptMissing) {
                                    toast.error('Cannot approve: Payment screenshot is missing!');
                                    return;
                                  }
                                  handleApprove(biz._id);
                                }}
                                disabled={cannotApprove}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[40px] ${
                                  cannotApprove
                                    ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                                    : 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100 cursor-pointer shadow-2xs'
                                }`}
                                style={{ border: '1px solid' }}
                                aria-label={`Approve ${biz.title}`}
                                title={
                                  isOwnerSpam
                                    ? 'Cannot approve: Owner flagged as spam'
                                    : receiptMissing
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
                          {/* Spam / Un-spam Button (Main Admin ONLY) */}
                          {isSuperAdmin && biz.owner && (
                            biz.owner.isSpam ? (
                              <button
                                type="button"
                                onClick={() => handleUnspamUser(biz)}
                                disabled={unspamLoadingId === (biz.owner._id || biz.owner)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer min-h-[40px]"
                                aria-label={`Un-spam owner of ${biz.title}`}
                                title="Un-spam User & Restore Listings"
                              >
                                <ShieldCheck size={14} />
                                <span>{unspamLoadingId === (biz.owner._id || biz.owner) ? 'Restoring...' : 'Un-spam'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenSpamModal(biz)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer min-h-[40px]"
                                aria-label={`Flag owner of ${biz.title} as spam`}
                                title="Flag User as Spam"
                              >
                                <AlertTriangle size={14} />
                                <span>Spam</span>
                              </button>
                            )
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
                          {isSuperAdmin && p.paymentStatus !== 'verified' && (
                            <button
                              type="button"
                              disabled={updatingPaymentStatus}
                              onClick={() => handleUpdatePaymentStatus(p._id, 'verified')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-300 cursor-pointer min-h-[36px]"
                              title="Verify Payment Receipt"
                            >
                              <Check size={13} /> Verify
                            </button>
                          )}
                          {isSuperAdmin && p.paymentStatus !== 'rejected' && (
                            <button
                              type="button"
                              disabled={updatingPaymentStatus}
                              onClick={() => handleUpdatePaymentStatus(p._id, 'rejected')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-300 cursor-pointer min-h-[36px]"
                              title="Reject Payment Receipt"
                            >
                              <X size={13} /> Reject
                            </button>
                          )}
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
              <div className="space-y-4">
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
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search users by name or email..."
                      className="form-input pl-9 text-sm"
                    />
                  </div>
                  <button type="submit" className="btn-secondary text-xs px-3 py-2 font-semibold min-h-[38px] shrink-0">
                    Search
                  </button>
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearch('');
                        setPage(1);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 px-1"
                    >
                      Clear
                    </button>
                  )}
                </form>

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
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                • {u.businessCount ?? 0} {u.businessCount === 1 ? 'business' : 'businesses'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                • {u.reviewCount ?? 0} {u.reviewCount === 1 ? 'review' : 'reviews'}
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
                                  onClick={() => handleDeleteUser(u)}
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
              </div>
            ) : tab === 'emails' ? (
              <div className="space-y-6">
                {/* (a) Counter cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Total emails sent</p>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                        <Mail size={18} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                      {emailStats.total}
                    </p>
                  </div>

                  <div className="card p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Sent today</p>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                        <Clock size={18} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                      {emailStats.today}
                    </p>
                  </div>
                </div>

                {/* (b) Send email form */}
                <div className="card p-4 sm:p-6">
                  <div className="pb-3 mb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Send size={16} className="text-blue-600" />
                        Send Email
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Compose and send branded emails directly to users or custom email addresses.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSendEmail} className="space-y-4">
                    {/* Recipient To field + user-picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        To (Recipient Email) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={emailForm.to}
                            onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                            placeholder="Enter recipient email address"
                            className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setUserPickerOpen(!userPickerOpen)}
                            className="btn-secondary flex items-center justify-center gap-1.5 text-xs whitespace-nowrap px-3.5 py-2.5 cursor-pointer"
                          >
                            <Users size={14} />
                            <span>{userPickerOpen ? 'Close Picker' : 'Pick Registered User'}</span>
                          </button>
                        </div>

                        {userPickerOpen && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-3 max-h-72 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <span className="text-xs font-semibold text-gray-700">Select user to populate To field</span>
                              <button
                                type="button"
                                onClick={() => setUserPickerOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                aria-label="Close user picker"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="relative my-2">
                              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="text"
                                value={userPickerSearch}
                                onChange={(e) => setUserPickerSearch(e.target.value)}
                                placeholder="Search users by name or email..."
                                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                              {userPickerLoading ? (
                                <p className="text-xs text-gray-400 text-center py-4">Searching users...</p>
                              ) : userPickerResults.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">
                                  {userPickerSearch.trim() ? 'No users matching search.' : 'No users found.'}
                                </p>
                              ) : (
                                userPickerResults.map((u) => (
                                  <button
                                    key={u._id}
                                    type="button"
                                    onClick={() => {
                                      setEmailForm((prev) => ({ ...prev, to: u.email }));
                                      setUserPickerOpen(false);
                                      setUserPickerSearch('');
                                    }}
                                    className="w-full text-left p-2 hover:bg-blue-50/60 rounded-md transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{u.name}</p>
                                      <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                                    </div>
                                    {u.role && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                      </span>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-700">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-gray-400">
                          {emailForm.subject.length}/200
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={200}
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g. Important update regarding your business listing"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>

                    {/* Message textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-700">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-gray-400">
                          {emailForm.message.length}/5000
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={5000}
                        value={emailForm.message}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Type your message here..."
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={sendingEmail || !emailForm.to.trim() || !emailForm.subject.trim() || !emailForm.message.trim()}
                        className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Send size={15} />
                        <span>{sendingEmail ? 'Sending...' : 'Send Email'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* (c) Sent-email log table */}
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Sent Email Log</h3>
                      <p className="text-xs text-gray-500">Record of outgoing emails dispatched through the platform.</p>
                    </div>
                    {pagination?.totalResults != null && (
                      <span className="badge badge-gray text-xs">
                        {pagination.totalResults} total
                      </span>
                    )}
                  </div>

                  {emailLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No email logs recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-4">To</th>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {emailLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900 break-all">{log.to}</td>
                              <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={log.subject}>
                                {log.subject}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`badge ${
                                    log.type === 'manual'
                                      ? 'badge-blue'
                                      : log.type === 'spam'
                                      ? 'badge-red'
                                      : log.type === 'unspam'
                                      ? 'badge-green'
                                      : 'badge-gray'
                                  } capitalize`}
                                >
                                  {log.type === 'unspam' ? 'Un-spam' : log.type}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`badge ${log.status === 'sent' ? 'badge-green' : 'badge-red'} capitalize`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : tab === 'activity' ? (
              <div className="space-y-6">
                {/* Action-filter dropdown header */}
                <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Activity size={18} className="text-cyan-600" />
                      Admin Activity Log
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Immutable audit trail of administrative actions and system updates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter size={15} className="text-gray-400 shrink-0" />
                    <select
                      value={activityActionFilter}
                      onChange={(e) => {
                        setActivityActionFilter(e.target.value);
                        setPage(1);
                      }}
                      className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                      aria-label="Filter activity by action"
                    >
                      {ACTIVITY_ACTIONS.map((act) => (
                        <option key={act.value} value={act.value}>
                          {act.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Activity Log Table */}
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Audit Trail</h3>
                      <p className="text-xs text-gray-500">Record of actions performed by administrators.</p>
                    </div>
                    {pagination?.totalResults != null && (
                      <span className="badge badge-gray text-xs">
                        {pagination.totalResults} {pagination.totalResults === 1 ? 'action' : 'actions'}
                      </span>
                    )}
                  </div>

                  {activityLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity size={40} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No activity recorded yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Admin</th>
                            <th className="py-3 px-4">Action</th>
                            <th className="py-3 px-4">Target</th>
                            <th className="py-3 px-4">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {activityLogs.map((log) => {
                            const actionLabel = ACTIVITY_ACTIONS.find((a) => a.value === log.action)?.label || log.action;
                            const isDanger =
                              log.action.startsWith('delete_') ||
                              log.action.startsWith('reject_') ||
                              log.action === 'spam_user';
                            const isSuccess =
                              log.action.startsWith('approve_') ||
                              log.action.startsWith('verify_') ||
                              log.action === 'unspam_user';
                            const badgeClass = isDanger
                              ? 'badge-red'
                              : isSuccess
                              ? 'badge-green'
                              : 'badge-blue';

                            return (
                              <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                                  {log.actorName || log.actor?.name || 'Admin'}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`badge ${badgeClass}`}>
                                    {actionLabel}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800 break-all">{log.targetLabel || '—'}</span>
                                    <span className="text-[10px] text-gray-400 capitalize">{log.targetType}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-600 max-w-xs break-words">
                                  {log.details || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
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
            ) : tab === 'claims' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Claim Requests
                    </h3>
                    <p className="text-xs text-gray-500">
                      Manage business ownership claim requests. Direct email claims require admin review and approval.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {claimRequests.filter((c) => c.status === 'pending_admin').length > 0 && (
                      <span className="badge badge-yellow">
                        {claimRequests.filter((c) => c.status === 'pending_admin').length} Pending Approval
                      </span>
                    )}
                    <span className="badge badge-blue">
                      {claimRequests.length} Total Requests
                    </span>
                  </div>
                </div>

                {claimRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No claim requests recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Business &amp; Contact Info</th>
                          <th className="py-3 px-4">Claimant Details</th>
                          <th className="py-3 px-4">Path Used</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {claimRequests.map((claim) => (
                          <tr key={claim._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {claim.business ? (
                                <Link
                                  href={`/businesses/${claim.business.slug || claim.business._id}`}
                                  target="_blank"
                                  className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                >
                                  {claim.business.title} <ExternalLink size={12} />
                                </Link>
                              ) : (
                                <span className="text-gray-400 italic">Deleted Business</span>
                              )}
                              <div className="mt-1 space-y-0.5 text-[11px] text-gray-500 font-normal">
                                <div>
                                  <span className="font-semibold text-gray-700">Listed Phone:</span>{' '}
                                  {claim.business?.phone || claim.business?.whatsapp || (
                                    <span className="text-gray-400 italic">None</span>
                                  )}
                                </div>
                                <div>
                                  <span className="font-semibold text-gray-700">Registered Email:</span>{' '}
                                  {claim.business?.email ? (
                                    <span className="font-mono text-gray-800 select-all font-medium">
                                      {claim.business.email}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">None</span>
                                  )}
                                </div>
                                {claim.business?.address?.city && (
                                  <div className="text-gray-400">
                                    {claim.business.address.city}
                                    {claim.business.address.country ? `, ${claim.business.address.country}` : ''}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              <div className="font-bold text-gray-900">{claim.claimantName}</div>
                              <div className="font-mono text-gray-700 mt-0.5 select-all">{claim.chosenEmail}</div>
                              <div className="text-gray-600 mt-0.5">{claim.phone}</div>
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {claim.emailOption === 'registered' ||
                              (claim.business?.email &&
                                claim.chosenEmail?.toLowerCase() === claim.business.email?.toLowerCase()) ? (
                                <span className="badge badge-blue text-[11px] font-semibold py-0.5 px-2">
                                  Registered Email
                                </span>
                              ) : (
                                <span className="badge badge-purple text-[11px] font-semibold py-0.5 px-2">
                                  Direct Email
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`badge ${
                                  claim.status === 'completed' || claim.status === 'approved'
                                    ? 'badge-green'
                                    : claim.status === 'verified'
                                    ? 'badge-blue'
                                    : claim.status === 'pending_admin'
                                    ? 'badge-yellow'
                                    : claim.status === 'rejected'
                                    ? 'badge-red'
                                    : 'badge-gray'
                                }`}
                                style={{ fontSize: '0.7rem', padding: '2px 8px', textTransform: 'capitalize' }}
                              >
                                {claim.status === 'pending_admin'
                                  ? 'Pending Admin'
                                  : claim.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-xs">
                              {new Date(claim.createdAt).toLocaleDateString()}
                              <span className="text-[10px] text-gray-400 block">
                                {new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {claim.status === 'pending_admin' && (isSuperAdmin || perms.canApproveListings) ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={Boolean(claimActionLoading[claim._id])}
                                    onClick={() => handleApproveClaim(claim)}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Approve claim and transfer ownership"
                                  >
                                    <Check size={13} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(claimActionLoading[claim._id])}
                                    onClick={() => handleRejectClaim(claim)}
                                    className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Reject claim"
                                  >
                                    <X size={13} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            {/* Pagination for businesses & users */}
            {tab !== 'payment-settings' && tab !== 'claims' && pagination && pagination.totalPages > 1 && (
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
                </div>
              )}
            </>
          ) : activeSection === 'payments' ? (
            renderPaymentsView()
          ) : activeSection === 'reports' ? (
            renderReportsView()
          ) : activeSection === 'settings' ? (
            renderSettingsView()
          ) : (
            <AdminPlaceholderView
              section={activeSection}
              onBackToDashboard={() => setActiveSection('dashboard')}
              onDownloadBackup={handleDownloadBackup}
              isExportingBackup={isExportingBackup}
              onLogout={handleLogout}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <AdminBottomNav
          activeSection={activeSection}
          activeTab={tab}
          onSelectSection={handleSelectSection}
          isMoreOpen={mobileMoreOpen}
          setIsMoreOpen={setMobileMoreOpen}
          tabs={tabs}
          dashStats={dashStats}
          onLogout={handleLogout}
          onDownloadBackup={handleDownloadBackup}
          isExportingBackup={isExportingBackup}
          isSuperAdmin={isSuperAdmin}
        />
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
                  {selectedReceiptBiz.title} • Fee: {selectedReceiptBiz.address?.country === 'UAE' ? 'AED ' : selectedReceiptBiz.address?.country === 'USA' ? '$' : 'Rs. '}{selectedReceiptBiz.paymentAmount || 500} • Status: <span className="capitalize font-semibold text-gray-800">{selectedReceiptBiz.paymentStatus || 'pending'}</span>
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

              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdmin && selectedReceiptBiz.paymentStatus !== 'verified' && (
                  <button
                    type="button"
                    disabled={updatingPaymentStatus}
                    onClick={() => handleUpdatePaymentStatus(selectedReceiptBiz._id, 'verified')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 cursor-pointer"
                    title="Mark payment status as Verified"
                  >
                    <Check size={13} /> Verify Receipt
                  </button>
                )}
                {isSuperAdmin && selectedReceiptBiz.paymentStatus !== 'rejected' && (
                  <button
                    type="button"
                    disabled={updatingPaymentStatus}
                    onClick={() => handleUpdatePaymentStatus(selectedReceiptBiz._id, 'rejected')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 cursor-pointer"
                    title="Mark payment status as Rejected"
                  >
                    <X size={13} /> Reject Receipt
                  </button>
                )}
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

      {/* Confirmation Modal: Mark User as Spam */}
      {spamTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            if (!isSpamSubmitting) {
              setSpamTarget(null);
              setSpamReason('');
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="spam-user-modal-title"
        >
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <button
                type="button"
                disabled={isSpamSubmitting}
                onClick={() => {
                  setSpamTarget(null);
                  setSpamReason('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Title */}
            <h3
              id="spam-user-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-950 leading-snug mb-2"
            >
              Flag User as Spam?
            </h3>

            {/* Target User Info */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mb-3 text-xs sm:text-sm">
              <span className="text-gray-500">Target User: </span>
              <span className="font-bold text-gray-900">{spamTarget.user?.name || 'User'}</span>
              <span className="text-gray-500 block truncate text-xs mt-0.5">{spamTarget.user?.email}</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
              Flagging this user will execute the following actions:
            </p>

            <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 mb-4 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>Mark user as <strong>spam</strong> and block future registrations with this email.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span><strong>Hide all approved business listings</strong> owned by this user from public view.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>Send notification email with WhatsApp contact info for appeals.</span>
              </li>
            </ul>

            {/* Reason Input (Required) */}
            <div className="mb-5">
              <label htmlFor="spam-reason-input" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
                Reason for flagging <span className="text-red-500">*</span>
                <span className="font-normal text-gray-500 text-xs ml-1">(max 200 chars)</span>
              </label>
              <textarea
                id="spam-reason-input"
                rows={3}
                maxLength={200}
                value={spamReason}
                onChange={(e) => setSpamReason(e.target.value)}
                placeholder="Enter a reason (e.g., Fake listings, abusive behavior, promotional spam)..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-gray-900 placeholder:text-gray-400"
                disabled={isSpamSubmitting}
                autoFocus
              />
              <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1">
                <span>Required field</span>
                <span>{spamReason.length}/200</span>
              </div>
            </div>

            {/* Actions: Cancel and Confirm */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isSpamSubmitting}
                onClick={() => {
                  setSpamTarget(null);
                  setSpamReason('');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer min-h-[44px] text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSpamSubmitting || !spamReason.trim()}
                onClick={handleConfirmSpam}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[44px] shadow-sm flex items-center justify-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>{isSpamSubmitting ? 'Flagging User...' : 'Flag as Spam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete User Permanently */}
      {deleteUserTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto"
          onClick={() => {
            if (!isDeletingUser) {
              setDeleteUserTarget(null);
              setDeleteUserAcknowledged(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-modal-title"
        >
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => {
                  setDeleteUserTarget(null);
                  setDeleteUserAcknowledged(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Title */}
            <h3
              id="delete-user-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-950 leading-snug mb-2"
            >
              Permanently delete this user?
            </h3>

            {/* Target User Info & Counts */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mb-3 text-xs sm:text-sm space-y-1.5">
              <div>
                <span className="text-gray-500">Target User: </span>
                <span className="font-bold text-gray-900">{deleteUserTarget.name}</span>
                <span className="text-gray-500 block truncate text-xs mt-0.5">{deleteUserTarget.email}</span>
              </div>
              <div className="flex items-center gap-4 pt-1.5 border-t border-gray-200 text-xs">
                <span className="text-gray-600">
                  Businesses: <strong className="text-gray-900">{deleteUserTarget.businessCount ?? 0}</strong>
                </span>
                <span className="text-gray-600">
                  Reviews: <strong className="text-gray-900">{deleteUserTarget.reviewCount ?? 0}</strong>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
              This action is a <strong>hard delete</strong> and <strong>cannot be undone</strong>. Deleting this account permanently removes:
            </p>

            <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 mb-4 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>The user account and profile data</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span><strong>ALL business listings</strong> owned by this user (including all uploaded Cloudinary images and payment receipts)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span><strong>ALL reviews</strong> submitted by this user</span>
              </li>
            </ul>

            <div className="p-3 bg-red-50/80 border border-red-200/90 rounded-xl text-xs text-red-900 leading-relaxed mb-4">
              ⚠️ <strong>Critical Warning:</strong> Once deleted, all associated listings, photos, reviews, and transaction records will be permanently erased. There is no way to recover this data.
            </div>

            {/* Checkbox Acknowledgment */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer mb-5">
              <input
                type="checkbox"
                id="delete-user-ack-checkbox"
                checked={deleteUserAcknowledged}
                onChange={(e) => setDeleteUserAcknowledged(e.target.checked)}
                disabled={isDeletingUser}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-800 select-none">
                I understand this cannot be undone
              </span>
            </label>

            {/* Actions: Cancel and Confirm / Delete permanently */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => {
                  setDeleteUserTarget(null);
                  setDeleteUserAcknowledged(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer min-h-[44px] text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteUserAcknowledged || isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[44px] shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{isDeletingUser ? 'Deleting Permanently...' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Payment Method (Batch 3 Pattern) */}
      {deleteMethodTarget && (
        <div
          className="fixed inset-x-0 inset-y-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-auto"
          onClick={() => {
            if (!isDeletingMethod) {
              setDeleteMethodTarget(null);
              setDeleteMethodAcknowledged(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-method-modal-title"
        >
          <div
            className="relative bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon & Close Button */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-2xs">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <button
                type="button"
                disabled={isDeletingMethod}
                onClick={() => {
                  setDeleteMethodTarget(null);
                  setDeleteMethodAcknowledged(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Title */}
            <h3
              id="delete-method-modal-title"
              className="text-lg sm:text-xl font-bold text-gray-950 leading-snug mb-2"
            >
              Permanently delete this payment method?
            </h3>

            {/* Target Info */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mb-3 text-xs sm:text-sm">
              <span className="text-gray-500">Method: </span>
              <span className="font-bold text-gray-900">{deleteMethodTarget.name}</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
              This action will remove this payment option immediately from the user-facing checkout and submission instructions.
            </p>

            {/* Checkbox Acknowledgment */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer mb-5">
              <input
                type="checkbox"
                id="delete-method-ack-checkbox"
                checked={deleteMethodAcknowledged}
                onChange={(e) => setDeleteMethodAcknowledged(e.target.checked)}
                disabled={isDeletingMethod}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-800 select-none">
                I understand this cannot be undone
              </span>
            </label>

            {/* Actions: Cancel and Confirm */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isDeletingMethod}
                onClick={() => {
                  setDeleteMethodTarget(null);
                  setDeleteMethodAcknowledged(false);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer min-h-[44px] text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteMethodAcknowledged || isDeletingMethod}
                onClick={handleConfirmDeleteMethod}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer min-h-[44px] shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{isDeletingMethod ? 'Deleting...' : 'Delete permanently'}</span>
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

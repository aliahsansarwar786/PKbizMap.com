'use client';

import { useState, useEffect, useCallback } from 'react';
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
  QrCode, Upload
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = '#2563eb' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#6b7280' }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>{value ?? '—'}</p>
    </div>
  );
}

export default function AdminDashboardClient() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('pending');
  const [dashStats, setDashStats] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Raast QR Payment Gateway Settings
  const [paymentConfig, setPaymentConfig] = useState({
    isEnabled: false,
    feeAmount: 500,
    qrCode: { url: '', publicId: '' },
    raastId: '',
    accountTitle: 'BizPrimeHub',
    bankName: 'Raast Instant Payment',
    instructions: 'Scan this Raast QR code with any banking or wallet app (JazzCash, EasyPaisa, SadaPay, NayaPay, HBL, Meezan, etc.), complete payment, and upload the transaction screenshot below.',
  });
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState(null);
  const [deletingQrCode, setDeletingQrCode] = useState(false);
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(false);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [selectedReceiptBiz, setSelectedReceiptBiz] = useState(null);
  const [deletingReceipt, setDeletingReceipt] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push('/login');
      else if (!isAdmin) router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Load stats & initial payment settings
  useEffect(() => {
    if (!isAdmin) return;
    adminAPI.getDashboard()
      .then((res) => setDashStats(res.data.stats))
      .catch(() => toast.error('Failed to load stats.'))
      .finally(() => setStatsLoading(false));

    adminAPI.getPaymentSettings()
      .then((res) => {
        const s = res.data?.settings || res.data?.paymentSetting;
        if (s) setPaymentConfig(s);
      })
      .catch(() => {});
  }, [isAdmin]);

  // Load tab data
  const loadTabData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      if (tab === 'pending') {
        const res = await adminAPI.getPendingBusinesses({ page, limit: 10 });
        setBusinesses(res.data.businesses);
        setPagination(res.data.pagination);
      } else if (tab === 'all-businesses') {
        const res = await adminAPI.getAllBusinesses({ page, limit: 10 });
        setBusinesses(res.data.businesses);
        setPagination(res.data.pagination);
      } else if (tab === 'users') {
        const res = await adminAPI.getUsers({ page, limit: 10 });
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else if (tab === 'payment-settings') {
        setLoadingPaymentConfig(true);
        try {
          const res = await adminAPI.getPaymentSettings();
          const s = res.data?.settings || res.data?.paymentSetting;
          if (s) {
            setPaymentConfig(s);
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
  }, [tab, page, isAdmin]);

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

  const handleUpdateRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to "${newRole}".`);
    } catch (err) {
      toast.error(err.message || 'Failed to update role.');
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
        setPaymentConfig(s);
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
    const finalFee = Number(paymentConfig.feeAmount);
    if (isNaN(finalFee) || finalFee < 0) {
      toast.error('Listing fee amount cannot be negative.');
      return;
    }
    setSavingPaymentConfig(true);
    try {
      const formData = new FormData();
      formData.append('isEnabled', paymentConfig.isEnabled);
      formData.append('feeAmount', finalFee);
      formData.append('raastId', paymentConfig.raastId || '');
      formData.append('accountTitle', paymentConfig.accountTitle || '');
      formData.append('bankName', paymentConfig.bankName || '');
      formData.append('instructions', paymentConfig.instructions || '');
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      const res = await adminAPI.updatePaymentSettings(formData);
      const s = res.data?.settings || res.data?.paymentSetting;
      if (s) {
        setPaymentConfig(s);
      }
      if (qrCodePreview) {
        URL.revokeObjectURL(qrCodePreview);
        setQrCodePreview(null);
      }
      setQrCodeFile(null);
      toast.success('Raast payment settings updated successfully!');
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
          ? 'Raast QR payment requirement ENABLED for all new listings!'
          : 'Payment requirement DISABLED — Business listings are now FREE!'
      );
    } catch (err) {
      setPaymentConfig(paymentConfig);
      toast.error(err.message || 'Failed to update status.');
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

  if (authLoading || (!isAdmin && !authLoading)) {
    return <div className="section container-max text-center"><p style={{ color: '#6b7280' }}>Loading...</p></div>;
  }

  const tabs = [
    { id: 'pending', label: 'Pending', badge: dashStats?.pendingBusinesses },
    { id: 'all-businesses', label: 'All Businesses' },
    { id: 'users', label: 'Users' },
    {
      id: 'payment-settings',
      label: 'Raast QR Settings',
      badge: paymentConfig.isEnabled ? 'ON' : 'OFF',
      badgeClass: paymentConfig.isEnabled ? 'badge-green' : 'badge-gray',
    },
  ];

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
            <Shield size={22} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>Admin Dashboard</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Manage businesses, users, and Raast QR payment gateway</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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

        {/* Tabs Bar */}
        <div className="card overflow-hidden">
          <div className="flex border-b overflow-x-auto" style={{ borderColor: '#e5e7eb' }}>
            {tabs.map(({ id, label, badge, badgeClass }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setPage(1); }}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
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
                    style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
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
                              {biz.address?.city}
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
                                onClick={() => setSelectedReceiptBiz(biz)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                title="Click to view payment screenshot"
                              >
                                <ImageIcon size={12} />
                                Rs. {biz.paymentAmount || 'Paid'} (View Receipt)
                              </button>
                            ) : biz.paymentAmount > 0 ? (
                              <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                Fee: Rs. {biz.paymentAmount} (No Receipt)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          {biz.paymentReceipt?.url && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptBiz(biz)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', cursor: 'pointer' }}
                              aria-label={`View payment receipt for ${biz.title}`}
                              title="View JazzCash Payment Screenshot"
                            >
                              <Eye size={13} /> View Screenshot
                            </button>
                          )}

                          {!biz.isApproved && (
                            <button
                              onClick={() => handleApprove(biz._id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', cursor: 'pointer' }}
                              aria-label={`Approve ${biz.title}`}
                            >
                              <Check size={13} /> Approve
                            </button>
                          )}
                          {!biz.isApproved && (
                            <button
                              onClick={() => handleReject(biz._id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', cursor: 'pointer' }}
                              aria-label={`Reject ${biz.title}`}
                            >
                              <X size={13} /> Reject
                            </button>
                          )}
                          <Link
                            href={biz.isApproved ? `/businesses/${biz._id}` : '#'}
                            className={`p-2 rounded-lg transition-colors ${!biz.isApproved ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            aria-label={`View ${biz.title}`}
                            style={{ color: '#6b7280' }}
                            onClick={(e) => !biz.isApproved && e.preventDefault()}
                          >
                            <CheckCircle2 size={15} />
                          </Link>
                          <Link
                            href={`/dashboard/businesses/${biz._id}`}
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            aria-label={`Edit ${biz.title}`}
                            style={{ color: '#2563eb' }}
                          >
                            <Edit3 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDeleteBusiness(biz._id, biz.title)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                            aria-label={`Delete ${biz.title}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
                        className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }} className="truncate">
                            {u.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{u.email}</span>
                            <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                              {u.role}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {u._id !== user?._id && (
                            <>
                              <button
                                onClick={() => handleUpdateRole(u._id, u.role)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                                aria-label={`Toggle role for ${u.name}`}
                              >
                                {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                                aria-label={`Delete user ${u.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                          {u._id === user?._id && (
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>You</span>
                          )}
                        </div>
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
                  {/* Fee Amount Section */}
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                          Listing Fee Amount (PKR)
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                          Apni marzi ki custom amount (jaise 10, 70, 100, 500) likhein ya quick buttons se select karein
                        </p>
                      </div>
                      <div
                        className="px-3.5 py-1.5 rounded-xl font-bold text-base shadow-sm"
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                      >
                        Rs. {paymentConfig.feeAmount !== '' && paymentConfig.feeAmount !== undefined ? paymentConfig.feeAmount : 0}
                      </div>
                    </div>

                    {/* Numeric Input & Step Controls */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Type Custom Amount (e.g. 10, 70):
                      </label>
                      <div className="flex items-center gap-2">
                        {/* - 100 button */}
                        <button
                          type="button"
                          onClick={() => setPaymentConfig((p) => ({ ...p, feeAmount: Math.max(0, (Number(p.feeAmount) || 0) - 100) }))}
                          className="btn-secondary px-2.5 py-2 text-xs font-bold"
                          title="Decrease fee by Rs. 100"
                        >
                          -100
                        </button>
                        {/* - 10 button */}
                        <button
                          type="button"
                          onClick={() => setPaymentConfig((p) => ({ ...p, feeAmount: Math.max(0, (Number(p.feeAmount) || 0) - 10) }))}
                          className="btn-secondary px-2.5 py-2 text-xs font-bold"
                          title="Decrease fee by Rs. 10"
                        >
                          -10
                        </button>

                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                            Rs.
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={paymentConfig.feeAmount ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPaymentConfig({
                                ...paymentConfig,
                                feeAmount: val === '' ? '' : Math.max(0, Number(val)),
                              });
                            }}
                            className="form-input pl-12 text-base font-bold"
                            placeholder="Enter custom amount (e.g. 10, 70, 500)"
                            required
                          />
                        </div>

                        {/* + 10 button */}
                        <button
                          type="button"
                          onClick={() => setPaymentConfig((p) => ({ ...p, feeAmount: (Number(p.feeAmount) || 0) + 10 }))}
                          className="btn-secondary px-2.5 py-2 text-xs font-bold"
                          title="Increase fee by Rs. 10"
                        >
                          +10
                        </button>
                        {/* + 100 button */}
                        <button
                          type="button"
                          onClick={() => setPaymentConfig((p) => ({ ...p, feeAmount: (Number(p.feeAmount) || 0) + 100 }))}
                          className="btn-secondary px-2.5 py-2 text-xs font-bold"
                          title="Increase fee by Rs. 100"
                        >
                          +100
                        </button>
                      </div>
                    </div>

                    {/* Quick Amount Presets */}
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Quick Select Presets:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[10, 20, 50, 70, 100, 200, 300, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setPaymentConfig((p) => ({ ...p, feeAmount: amt }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              Number(paymentConfig.feeAmount) === amt
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            Rs. {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f9fafb', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #f3f4f6' }}>
                      💡 <strong>Custom Amount:</strong> Aap apni marzi se box me koi bhi number (jaise <strong>10</strong> ya <strong>70</strong>) likh sakte hain, aur neechay <strong>&ldquo;Save Payment Settings&rdquo;</strong> par click karein.
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
                  <strong>City:</strong> {selectedReceiptBiz.address?.city || 'N/A'}
                </div>
              </div>
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
                {selectedReceiptBiz.paymentReceipt?.url && (
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
                {!selectedReceiptBiz.isApproved && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedReceiptBiz._id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                    style={{ border: 'none', cursor: 'pointer' }}
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
    </div>
  );
}

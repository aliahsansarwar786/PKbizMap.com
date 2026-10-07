'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users, Building2, Clock, CheckCircle2, Star,
  Check, X, Trash2, ChevronLeft, ChevronRight, Shield
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

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push('/login');
      else if (!isAdmin) router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Load stats
  useEffect(() => {
    if (!isAdmin) return;
    adminAPI.getDashboard()
      .then((res) => setDashStats(res.data.stats))
      .catch(() => toast.error('Failed to load stats.'))
      .finally(() => setStatsLoading(false));
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

  if (authLoading || (!isAdmin && !authLoading)) {
    return <div className="section container-max text-center"><p style={{ color: '#6b7280' }}>Loading...</p></div>;
  }

  const tabs = [
    { id: 'pending', label: 'Pending', badge: dashStats?.pendingBusinesses },
    { id: 'all-businesses', label: 'All Businesses' },
    { id: 'users', label: 'Users' },
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
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Manage your entire platform from here</p>
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

        {/* Tabs */}
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

        <div className="card overflow-hidden">
          <div className="flex border-b" style={{ borderColor: '#e5e7eb' }}>
            {tabs.map(({ id, label, badge }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setPage(1); }}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
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
                {badge != null && badge > 0 && (
                  <span
                    className="badge badge-yellow"
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
                        className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }} className="truncate">
                            {biz.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                              {biz.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {biz.address?.city}
                            </span>
                            {biz.owner && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                by {biz.owner.name}
                              </span>
                            )}
                            {biz.isApproved ? (
                              <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Approved</span>
                            ) : (
                              <span className="badge badge-yellow" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Pending</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
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
            ) : null}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
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
    </div>
  );
}

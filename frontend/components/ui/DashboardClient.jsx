'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { businessAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2, PlusCircle, CheckCircle2, Clock, XCircle,
  Eye, Edit3, Trash2, User, Shield, LayoutGrid
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
      <p style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1f2937' }}>{value}</p>
    </div>
  );
}

export default function DashboardClient() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    businessAPI.getMyBusinesses()
      .then((res) => {
        setBusinesses(res.data.businesses);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to load your businesses.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await businessAPI.delete(id);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
      toast.success('Business deleted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete business.');
    }
  };

  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div className="section container-max">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-xl h-24" />)}
        </div>
        <div className="skeleton rounded-xl h-64" />
      </div>
    );
  }

  const approved = businesses.filter((b) => b.isApproved).length;
  const pending = businesses.filter((b) => !b.isApproved).length;

  const avatarUrl = user?.avatar?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=64`;

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Image
              src={avatarUrl}
              alt={user?.name || 'User'}
              width={56}
              height={56}
              className="rounded-full object-cover"
              style={{ border: '3px solid #e5e7eb' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
                  Welcome, {user?.name}!
                </h1>
                {user?.role === 'admin' && (
                  <span className="badge badge-blue"><Shield size={11} /> Admin</span>
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/profile" className="btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                <User size={14} /> Profile
              </Link>
              <Link href="/add-business" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                <PlusCircle size={14} /> Add Business
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="My Listed Businesses" value={businesses.length} icon={LayoutGrid} color="#2563eb" />
          <StatCard label="Approved" value={approved} icon={CheckCircle2} color="#059669" />
          <StatCard label="Pending Review" value={pending} icon={Clock} color="#d97706" />
          <StatCard label="Account Type" value={user?.role === 'admin' ? 'Admin' : 'Member'} icon={Shield} color="#7c3aed" />
        </div>

        {/* Admin shortcut */}
        {user?.role === 'admin' && (
          <div
            className="card p-4 mb-6 flex items-center gap-3"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <Shield size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
            <div className="flex-1">
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1d4ed8' }}>Admin Access</p>
              <p style={{ fontSize: '0.8125rem', color: '#3b82f6' }}>You have full admin privileges.</p>
            </div>
            <Link href="/admin" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem', flexShrink: 0 }}>
              Admin Panel
            </Link>
          </div>
        )}

        {/* My Businesses */}
        <div className="card">
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>My Businesses</h2>
            <Link href="/add-business" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
              <PlusCircle size={14} /> Add New
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-16 p-5">
              <Building2 size={40} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                No businesses yet
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                Create your first business listing to get started.
              </p>
              <Link href="/add-business" className="btn-primary">
                <PlusCircle size={16} /> Add Business
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ '--tw-divide-color': '#f3f4f6' }}>
              {businesses.map((business) => (
                <div key={business._id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#f3f4f6' }}>
                    {business.images?.[0]?.url ? (
                      <Image
                        src={business.images[0].url}
                        alt={business.title}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={20} style={{ color: '#9ca3af' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }} className="truncate">
                      {business.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {business.category}
                      </span>
                      {business.isApproved ? (
                        <span className="badge badge-green" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          <CheckCircle2 size={9} /> Approved
                        </span>
                      ) : (
                        <span className="badge badge-yellow" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          <Clock size={9} /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {business.isApproved && (
                      <Link
                        href={`/businesses/${business._id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label={`View ${business.title}`}
                        style={{ color: '#6b7280' }}
                      >
                        <Eye size={16} />
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/businesses/${business._id}/edit`}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={`Edit ${business.title}`}
                      style={{ color: '#6b7280' }}
                    >
                      <Edit3 size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(business._id, business.title)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      aria-label={`Delete ${business.title}`}
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

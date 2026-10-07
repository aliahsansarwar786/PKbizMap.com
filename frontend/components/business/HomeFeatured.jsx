'use client';

import { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import { businessAPI } from '@/lib/api';

// Skeleton card
function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton" style={{ height: 180 }} />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded" style={{ width: '70%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '40%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '55%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '85%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '75%' }} />
        <div className="skeleton h-9 rounded" style={{ width: '100%', marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}

export default function HomeFeatured() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    businessAPI
      .getAll({ limit: 6, sort: '-createdAt' })
      .then((res) => setBusinesses(res.data.businesses))
      .catch(() => setError('Failed to load businesses.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 card p-8">
        <p style={{ color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 card p-8">
        <p style={{ color: '#6b7280' }}>No businesses listed yet. Be the first to add one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {businesses.map((business) => (
        <BusinessCard key={business._id} business={business} />
      ))}
    </div>
  );
}

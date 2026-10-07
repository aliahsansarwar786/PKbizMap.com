'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BusinessCard from './BusinessCard';
import { businessAPI } from '@/lib/api';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

const CATEGORIES = [
  '', 'IT', 'Real Estate', 'Restaurant', 'Healthcare', 'Education',
  'Automotive', 'Retail', 'Construction', 'Finance', 'Beauty',
  'Travel', 'Professional Services', 'Other',
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-averageRating', label: 'Highest Rated' },
  { value: 'title', label: 'A-Z' },
];

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton" style={{ height: 180 }} />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 rounded" style={{ width: '70%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '40%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '55%' }} />
        <div className="skeleton h-3 rounded" style={{ width: '85%' }} />
        <div className="skeleton h-9 rounded mt-2" />
      </div>
    </div>
  );
}

export default function BusinessDirectory() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await businessAPI.getAll({ keyword, category, city, sort, page, limit: 12 });
      setBusinesses(res.data.businesses);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [keyword, category, city, sort, page]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Update URL without refresh
  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (sort !== '-createdAt') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `/businesses?${qs}` : '/businesses', { scroll: false });
  }, [keyword, category, city, sort, page, router]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  const clearFilters = () => {
    setKeyword('');
    setCategory('');
    setCity('');
    setSort('-createdAt');
    setPage(1);
  };

  const hasActiveFilters = keyword || category || city || sort !== '-createdAt';

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-3">
              {/* Keyword search */}
              <div className="flex-1 relative">
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search businesses..."
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  aria-label="Search by keyword"
                />
              </div>

              {/* Category */}
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="select-field"
                style={{ width: 'auto', minWidth: 160 }}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {CATEGORIES.filter(Boolean).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* City */}
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City..."
                className="input-field"
                style={{ width: 'auto', minWidth: 130 }}
                aria-label="Filter by city"
              />

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="select-field"
                style={{ width: 'auto', minWidth: 140 }}
                aria-label="Sort results"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>
                <Search size={15} /> Search
              </button>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {keyword && (
                  <span className="badge badge-blue">
                    &ldquo;{keyword}&rdquo;
                    <button onClick={() => { setKeyword(''); setPage(1); }} className="ml-1" aria-label="Remove keyword filter">
                      <X size={11} />
                    </button>
                  </span>
                )}
                {category && (
                  <span className="badge badge-blue">
                    {category}
                    <button onClick={() => { setCategory(''); setPage(1); }} className="ml-1" aria-label="Remove category filter">
                      <X size={11} />
                    </button>
                  </span>
                )}
                {city && (
                  <span className="badge badge-blue">
                    {city}
                    <button onClick={() => { setCity(''); setPage(1); }} className="ml-1" aria-label="Remove city filter">
                      <X size={11} />
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="badge badge-gray" style={{ cursor: 'pointer' }}>
                  Clear all <X size={11} className="ml-1" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* ── Results info ──────────────────────────────────────────────── */}
        {!loading && pagination && (
          <div className="flex items-center justify-between mb-5">
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {pagination.totalResults === 0
                ? 'No businesses found'
                : `${pagination.totalResults} business${pagination.totalResults !== 1 ? 'es' : ''} found`}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        {error ? (
          <div className="text-center py-16 card p-10">
            <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
            <button onClick={fetchBusinesses} className="btn-primary">Try Again</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16 card p-10">
            <SlidersHorizontal size={40} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
              No businesses found
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Try adjusting your search filters or browse all categories.
            </p>
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {businesses.map((business) => (
              <BusinessCard key={business._id} business={business} />
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrevPage}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.875rem' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.currentPage;
                const isNearCurrent = Math.abs(pageNum - pagination.currentPage) <= 2;
                const isFirst = pageNum === 1;
                const isLast = pageNum === pagination.totalPages;

                if (!isFirst && !isLast && !isNearCurrent) {
                  if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                    return <span key={pageNum} style={{ color: '#9ca3af', padding: '0 4px' }}>...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={isActive ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.5rem 0.875rem', minWidth: 40 }}
                    aria-label={`Page ${pageNum}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.875rem' }}
              aria-label="Next page"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

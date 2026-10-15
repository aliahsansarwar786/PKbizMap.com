'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import BusinessCard from './BusinessCard';
import { businessAPI } from '@/lib/api';
import SearchableCombobox from '@/components/ui/SearchableCombobox';
import { COUNTRIES, getCities } from '@/data/locations';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Globe,
  MapPin,
  Star,
  RotateCcw,
  Tag,
  ArrowUpDown,
} from 'lucide-react';

const CATEGORIES = [
  'IT',
  'Real Estate',
  'Restaurant',
  'Healthcare',
  'Education',
  'Automotive',
  'Retail',
  'Construction',
  'Finance',
  'Beauty',
  'Travel',
  'Professional Services',
  'Other',
];

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5★ Only' },
  { value: '4+', label: '4★ & above' },
  { value: '3+', label: '3★ & above' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: '-averageRating', label: 'Top Rated' },
  { value: 'title', label: 'A-Z' },
  { value: 'createdAt', label: 'Oldest First' },
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

// Category List component for Desktop Left Sidebar & Mobile Accordion
function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  getCategoryCount,
  allCategoriesCount,
  onItemClick,
}) {
  return (
    <div className="space-y-1">
      {/* "All Categories" row on top */}
      <button
        type="button"
        onClick={() => {
          onSelectCategory('');
          if (onItemClick) onItemClick();
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
          !selectedCategory
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
        aria-current={!selectedCategory ? 'true' : undefined}
      >
        <span className="truncate">All Categories</span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
            !selectedCategory ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {allCategoriesCount}
        </span>
      </button>

      {/* Rows for ALL 13 categories */}
      {categories.map((cat) => {
        const count = getCategoryCount(cat);
        const isActive = selectedCategory === cat;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => {
              onSelectCategory(cat);
              if (onItemClick) onItemClick();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="truncate">{cat}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function BusinessDirectory() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);

  // Filters state initialized from URL query params
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Sync state if searchParams change externally (e.g. navigation from Browse cards or browser back/forward)
  useEffect(() => {
    const urlCountry = searchParams.get('country') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlCity = searchParams.get('city') || '';
    const urlKeyword = searchParams.get('keyword') || '';
    const urlRating = searchParams.get('rating') || '';
    const urlSort = searchParams.get('sort') || '-createdAt';
    const urlPage = Number(searchParams.get('page')) || 1;

    setCountry((prev) => (prev !== urlCountry ? urlCountry : prev));
    setCategory((prev) => (prev !== urlCategory ? urlCategory : prev));
    setCity((prev) => (prev !== urlCity ? urlCity : prev));
    setKeyword((prev) => (prev !== urlKeyword ? urlKeyword : prev));
    setRating((prev) => (prev !== urlRating ? urlRating : prev));
    setSort((prev) => (prev !== urlSort ? urlSort : prev));
    setPage((prev) => (prev !== urlPage ? urlPage : prev));
  }, [searchParams]);

  // Cities options dependent on chosen country
  const cityOptions = useMemo(() => {
    return country ? getCities(country) : [];
  }, [country]);

  // Debounce typing in keyword search
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // Category count for currently selected country (or aggregate if all countries)
  const getCategoryCount = useCallback(
    (cat) => {
      if (!summary?.categories) return 0;
      if (country && summary.categories[country]) {
        return summary.categories[country][cat] || 0;
      }
      return (
        (summary.categories.Pakistan?.[cat] || 0) +
        (summary.categories.UAE?.[cat] || 0) +
        (summary.categories.USA?.[cat] || 0)
      );
    },
    [summary, country]
  );

  // Total count for All Categories in currently selected country (or all countries)
  const getAllCategoriesCount = useCallback(() => {
    if (!summary) return 0;
    if (country && summary.countries) {
      return summary.countries[country] || 0;
    }
    return summary.total || 0;
  }, [summary, country]);

  // Handle Country selection change (resets dependent City)
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    setCity(''); // Clear dependent city selection
    setPage(1);
  };

  const handleCityChange = (newCity) => {
    setCity(newCity);
    setPage(1);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setPage(1);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
  };

  // Fetch businesses from API
  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await businessAPI.getAll({
        keyword,
        category,
        country,
        city,
        rating,
        sort,
        page,
        limit: 12,
      });
      setBusinesses(res.data?.businesses || []);
      setPagination(res.data?.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [keyword, category, country, city, rating, sort, page]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Fetch summary counts for Country / City / Category cards
  useEffect(() => {
    businessAPI.getSummary()
      .then((res) => {
        if (res.data) setSummary(res.data);
      })
      .catch((err) => {
        console.error('Failed to load summary counts:', err);
      });
  }, []);

  // Sync state to URL without full page reload (only when on /businesses)
  useEffect(() => {
    // If not on '/businesses' (e.g. on homepage '/'), do NOT navigate away or sync to /businesses
    if (pathname !== '/businesses') {
      return;
    }

    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (country && country !== 'All') params.set('country', country);
    if (city && city !== 'All') params.set('city', city);
    if (category && category !== 'All') params.set('category', category);
    if (rating && rating !== 'All') params.set('rating', rating);
    if (sort && sort !== '-createdAt') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const qs = params.toString();
    const targetUrl = qs ? `/businesses?${qs}` : '/businesses';
    const currentQs = searchParams ? searchParams.toString() : '';
    const currentUrl = currentQs ? `/businesses?${currentQs}` : '/businesses';

    // Do NOT run router.replace if URL already matches current filter state
    if (currentUrl !== targetUrl) {
      router.replace(targetUrl, { scroll: false });
    }
  }, [pathname, keyword, country, city, category, rating, sort, page, router, searchParams]);

  const clearFilters = () => {
    setKeywordInput('');
    setKeyword('');
    setCountry('');
    setCity('');
    setCategory('');
    setRating('');
    setSort('-createdAt');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(keyword) ||
    Boolean(country) ||
    Boolean(city) ||
    Boolean(category) ||
    Boolean(rating) ||
    sort !== '-createdAt';

  return (
    <div className="section-sm">
      <div className="container-max">
        {/* ── Filter Bar (Mandatory, directory controls) ─────────────────────────── */}
        <section
          className="rounded-2xl p-5 mb-8 shadow-sm transition-all"
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
          }}
          aria-label="Directory Filters"
        >
          {/* Header Row: Title & Clear Filters button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">Filter Businesses</h2>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear all filters"
                >
                  <RotateCcw size={12} />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Keyword Search */}
            <div className="lg:col-span-2 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Search by name, service..."
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                aria-label="Search by business name or keyword"
              />
              {keywordInput && (
                <button
                  type="button"
                  onClick={() => {
                    setKeywordInput('');
                    setKeyword('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Clear keyword"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Country Dropdown */}
            <div className="relative">
              <Globe
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              />
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-11 pl-8 pr-8 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                }}
                aria-label="Filter by Country"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dependent Searchable Combobox */}
            <div>
              <SearchableCombobox
                value={city}
                onChange={handleCityChange}
                options={cityOptions}
                disabled={!country}
                placeholder="All Cities..."
                disabledPlaceholder="Select country first"
                emptyMessage="No city found"
                ariaLabel="Filter by City"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <Tag
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              />
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 pl-8 pr-8 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                }}
                aria-label="Filter by Category"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating & Sort combined on small, separate on desktop */}
            <div className="grid grid-cols-2 gap-2 lg:col-span-1">
              {/* Rating Filter */}
              <div className="relative">
                <select
                  value={rating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  className="w-full h-11 px-3 pr-7 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-xs sm:text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                  }}
                  aria-label="Filter by Rating"
                >
                  {RATING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full h-11 px-3 pr-7 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white focus:bg-white text-xs sm:text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                  }}
                  aria-label="Sort listings"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips & Live Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
            {/* Results Count */}
            <div className="text-sm font-semibold text-gray-700">
              {loading ? (
                <span className="text-gray-400">Searching businesses...</span>
              ) : pagination ? (
                <span>
                  {pagination.totalResults === 0
                    ? '0 businesses found'
                    : `${pagination.totalResults} business${
                        pagination.totalResults !== 1 ? 'es' : ''
                      } found`}
                </span>
              ) : (
                <span>{businesses.length} businesses found</span>
              )}
            </div>

            {/* Filter Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {keyword && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    &ldquo;{keyword}&rdquo;
                    <button
                      type="button"
                      onClick={() => {
                        setKeywordInput('');
                        setKeyword('');
                        setPage(1);
                      }}
                      className="hover:text-blue-900 p-0.5"
                      aria-label="Remove keyword filter"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {country && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Country: {country}
                    <button
                      type="button"
                      onClick={() => handleCountryChange('')}
                      className="hover:text-blue-900 p-0.5"
                      aria-label="Remove country filter"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {city && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    City: {city}
                    <button
                      type="button"
                      onClick={() => handleCityChange('')}
                      className="hover:text-blue-900 p-0.5"
                      aria-label="Remove city filter"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {category}
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('')}
                      className="hover:text-blue-900 p-0.5"
                      aria-label="Remove category filter"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {rating && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    {rating === '5' ? '5★' : `${rating}★`}
                    <button
                      type="button"
                      onClick={() => handleRatingChange('')}
                      className="hover:text-amber-950 p-0.5"
                      aria-label="Remove rating filter"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {sort !== '-createdAt' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    Sort: {SORT_OPTIONS.find((s) => s.value === sort)?.label}
                    <button
                      type="button"
                      onClick={() => handleSortChange('-createdAt')}
                      className="hover:text-gray-900 p-0.5"
                      aria-label="Reset sort"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-800 underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Results Layout: Sticky Left Sidebar (Desktop lg+) + Results (Header + Cards) ── */}
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8 items-start">
          
          {/* ── Desktop Left Sidebar (Sticky ~280px) ────────────────── */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5">
              {/* Heading */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={17} className="text-blue-600" />
                  Filter Listings
                </h3>
                {category && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Section: Popular Categories */}
              <div className="mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Popular Categories
                </p>
                {country && (
                  <p className="text-[11px] text-gray-500 mb-2">
                    Counts for <span className="font-semibold text-gray-700">{country}</span>
                  </p>
                )}
              </div>

              {/* Category Rows for ALL 13 categories with Live Count Pills */}
              <CategoryList
                categories={CATEGORIES}
                selectedCategory={category}
                onSelectCategory={handleCategoryChange}
                getCategoryCount={getCategoryCount}
                allCategoriesCount={getAllCategoriesCount()}
              />
            </div>
          </aside>

          {/* ── Right Content Area ───────────────────────────────────── */}
          <div className="min-w-0">
            {/* ── Mobile Collapsible Accordion (<lg) ─────────────────── */}
            <div className="lg:hidden mb-6 bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-gray-900 bg-gray-50/70 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-expanded={isMobileCategoryOpen}
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  <span>Filter Listings</span>
                  {category && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {category}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform duration-200 ${
                    isMobileCategoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMobileCategoryOpen && (
                <div className="p-4 pt-2 border-t border-gray-100">
                  <div className="mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 mt-1">
                      Popular Categories
                    </p>
                    {country && (
                      <p className="text-[11px] text-gray-500 mb-2">
                        Counts for <span className="font-semibold text-gray-700">{country}</span>
                      </p>
                    )}
                  </div>

                  <CategoryList
                    categories={CATEGORIES}
                    selectedCategory={category}
                    onSelectCategory={handleCategoryChange}
                    getCategoryCount={getCategoryCount}
                    allCategoriesCount={getAllCategoriesCount()}
                    onItemClick={() => setIsMobileCategoryOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* ── Results Header: Found {totalResults} listings ──────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Found {pagination?.totalResults ?? businesses.length} listings
              </h2>
              {(country || category || city) && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500">
                  <span>Filtered by:</span>
                  <span className="font-semibold text-gray-800">
                    {[country, city, category].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}
            </div>

            {/* ── Business Cards Grid (Mobile single column, Desktop 2-3 columns) ── */}
            {error ? (
              <div className="text-center py-16 card p-10">
                <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
                <button onClick={fetchBusinesses} className="btn-primary">
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-16 card p-10 bg-white rounded-2xl border border-gray-100">
                <SlidersHorizontal
                  size={44}
                  className="text-gray-300 mx-auto mb-4"
                  aria-hidden="true"
                />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  No businesses found
                </h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                  No businesses found - try another city / category
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-primary px-6 py-2.5 shadow-md"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {businesses.map((business) => (
                  <BusinessCard key={business._id} business={business} />
                ))}
              </div>
            )}

            {/* ── Pagination ───────────────────────────────────────────── */}
            {!loading && pagination && pagination.totalPages > 1 && (
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
                    const isNearCurrent =
                      Math.abs(pageNum - pagination.currentPage) <= 2;
                    const isFirst = pageNum === 1;
                    const isLast = pageNum === pagination.totalPages;

                    if (!isFirst && !isLast && !isNearCurrent) {
                      if (pageNum === 2 || pageNum === pagination.totalPages - 1) {
                        return (
                          <span
                            key={pageNum}
                            style={{ color: '#9ca3af', padding: '0 4px' }}
                          >
                            ...
                          </span>
                        );
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
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { businessAPI } from '@/lib/api';
import { COUNTRIES, getCities } from '@/data/locations';
import {
  ChevronLeft,
  RotateCcw,
  Search,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Verified working Unsplash images (Status 200 OK audited)
const COUNTRY_FALLBACKS = {
  Pakistan: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&q=80',
  UAE: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  USA: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=80',
};

function PakistanFlag() {
  return (
    <svg viewBox="0 0 900 600" className="w-5 h-3.5 rounded-xs shadow-xs inline-block shrink-0" aria-hidden="true">
      <rect width="900" height="600" fill="#01411c" />
      <rect width="225" height="600" fill="#ffffff" />
      <circle cx="562.5" cy="300" r="180" fill="#ffffff" />
      <circle cx="615" cy="265" r="165" fill="#01411c" />
      <polygon points="630,220 645,260 685,260 655,285 665,325 630,300 595,325 605,285 575,260 615,260" fill="#ffffff" />
    </svg>
  );
}

function UAEFlag() {
  return (
    <svg viewBox="0 0 1200 600" className="w-5 h-3.5 rounded-xs shadow-xs inline-block shrink-0" aria-hidden="true">
      <rect width="1200" height="200" y="0" fill="#00732f" />
      <rect width="1200" height="200" y="200" fill="#ffffff" />
      <rect width="1200" height="200" y="400" fill="#000000" />
      <rect width="300" height="600" x="0" fill="#ff0000" />
    </svg>
  );
}

function USAFlag() {
  return (
    <svg viewBox="0 0 7410 3900" className="w-5 h-3.5 rounded-xs shadow-xs inline-block shrink-0" aria-hidden="true">
      <rect width="7410" height="3900" fill="#b22234" />
      <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
      <rect width="2964" height="2100" fill="#3c3b6e" />
    </svg>
  );
}

const COUNTRY_DETAILS = {
  Pakistan: {
    name: 'Pakistan',
    FlagComponent: PakistanFlag,
    image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&q=80',
    description: 'Explore verified businesses across Lahore, Karachi, Islamabad, Multan and 168+ cities.',
  },
  UAE: {
    name: 'UAE',
    FlagComponent: UAEFlag,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
    description: 'Discover companies in Dubai, Abu Dhabi, Sharjah, Ajman and across the United Arab Emirates.',
  },
  USA: {
    name: 'USA',
    FlagComponent: USAFlag,
    image: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=400&q=80',
    description: 'Find local businesses across New York, California, Texas, Illinois and 270+ cities.',
  },
};

// Exact 13 categories with exact requested descriptions and verified working Unsplash images
const CATEGORIES_LIST = [
  {
    name: 'IT',
    description: 'Software, web development, IT services and tech companies',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
  },
  {
    name: 'Real Estate',
    description: 'Property listings, agents, and real estate services',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
  },
  {
    name: 'Restaurant',
    description: 'Restaurants, cafes, food delivery, and catering',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  },
  {
    name: 'Healthcare',
    description: 'Clinics, hospitals, doctors, dentists, and wellness',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80',
  },
  {
    name: 'Education',
    description: 'Schools, tutoring, courses, and educational services',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
  },
  {
    name: 'Automotive',
    description: 'Car dealers, repair shops, and auto services',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
  },
  {
    name: 'Retail',
    description: 'Shops, stores, boutiques, and online retail',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
  },
  {
    name: 'Finance',
    description: 'Banks, accountants, financial advisors, and insurance',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
  },
  {
    name: 'Beauty',
    description: 'Salons, spas, barbershops, and beauty services',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
  },
  {
    name: 'Travel',
    description: 'Travel agencies, tours, hotels, and transport',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
  },
  {
    name: 'Professional Services',
    description: 'Lawyers, consultants, agencies, and professional services',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&q=80',
  },
  {
    name: 'Construction',
    description: 'Builders, contractors, and construction services',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80',
  },
  {
    name: 'Other',
    description: 'Other local businesses and services',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80',
  },
];

// Verified major city images
const CITY_IMAGES = {
  Lahore: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&q=80',
  Karachi: 'https://images.unsplash.com/photo-1608667508764-33cf0726b13a?w=400&q=80',
  Islamabad: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400&q=80',
  Multan: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&q=80',
  Rawalpindi: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400&q=80',
  Faisalabad: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&q=80',
  Peshawar: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&q=80',
  Quetta: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&q=80',
  Kabirwala: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&q=80',
  Dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  'Abu Dhabi': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&q=80',
  Sharjah: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  Ajman: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80',
  'Los Angeles': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400&q=80',
  Chicago: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&q=80',
  Houston: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=80',
  Miami: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=400&q=80',
};

export default function BrowseSection({
  isHomePage = false,
  selectedCountry = '',
  selectedCity = '',
  selectedCategory = '',
  onSelectCountry,
  onSelectCity,
  onSelectCategory,
  onClearAll,
  summary = null,
}) {
  const router = useRouter();

  // Selected Country state
  const [localCountry, setLocalCountry] = useState(selectedCountry || '');
  const [citySearch, setCitySearch] = useState('');
  const [showAllCities, setShowAllCities] = useState(false);
  const [internalSummary, setInternalSummary] = useState(summary || null);

  // Load summary if not provided from parent
  useEffect(() => {
    if (summary) {
      setInternalSummary(summary);
      return;
    }
    businessAPI.getSummary()
      .then((res) => {
        if (res.data) setInternalSummary(res.data);
      })
      .catch((err) => {
        console.error('Failed to load summary counts in BrowseSection:', err);
      });
  }, [summary]);

  // Keep localCountry in sync with selectedCountry when on directory page
  useEffect(() => {
    if (!isHomePage) {
      setLocalCountry(selectedCountry);
    }
  }, [isHomePage, selectedCountry]);

  const effectiveCountry = isHomePage ? localCountry : selectedCountry;

  // Cities for the selected country
  const allCountryCities = useMemo(() => {
    if (!effectiveCountry) return [];
    return getCities(effectiveCountry);
  }, [effectiveCountry]);

  // Sort cities: active listings first, then alphabetical
  const sortedCities = useMemo(() => {
    if (!effectiveCountry || !allCountryCities.length) return [];
    const cityCounts = internalSummary?.cities?.[effectiveCountry] || {};

    return [...allCountryCities].sort((a, b) => {
      const countA = cityCounts[a] || cityCounts[a.toLowerCase()] || 0;
      const countB = cityCounts[b] || cityCounts[b.toLowerCase()] || 0;
      if (countB !== countA) return countB - countA; // Higher listings first
      return a.localeCompare(b);
    });
  }, [allCountryCities, effectiveCountry, internalSummary]);

  // Filtered cities based on quick search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return sortedCities;
    const q = citySearch.trim().toLowerCase();
    return sortedCities.filter((c) => c.toLowerCase().includes(q));
  }, [sortedCities, citySearch]);

  // Paginate or limit initial city cards so page isn't 280 cards long unless searched or expanded
  const displayedCities = useMemo(() => {
    if (citySearch.trim() || showAllCities) {
      return filteredCities;
    }
    return filteredCities.slice(0, 12); // Initial top 12 cities
  }, [filteredCities, citySearch, showAllCities]);

  // Handlers
  const handleCountrySelect = (countryName) => {
    if (isHomePage) {
      setLocalCountry(countryName);
      setCitySearch('');
      setShowAllCities(false);
    } else {
      if (onSelectCountry) onSelectCountry(countryName);
      setCitySearch('');
      setShowAllCities(false);
    }
  };

  const handleResetCountry = () => {
    if (isHomePage) {
      setLocalCountry('');
      setCitySearch('');
      setShowAllCities(false);
    } else {
      if (onSelectCountry) onSelectCountry('');
      setCitySearch('');
      setShowAllCities(false);
    }
  };

  const handleCityClick = (cityName) => {
    if (isHomePage) {
      router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}&city=${encodeURIComponent(cityName)}`);
    } else {
      if (selectedCity === cityName) {
        if (onSelectCity) onSelectCity('');
      } else {
        if (onSelectCity) onSelectCity(cityName);
      }
    }
  };

  const handleCategoryClick = (categoryName) => {
    if (isHomePage) {
      router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}&category=${encodeURIComponent(categoryName)}`);
    } else {
      if (selectedCategory === categoryName) {
        if (onSelectCategory) onSelectCategory('');
      } else {
        if (onSelectCategory) onSelectCategory(categoryName);
      }
    }
  };

  const handleViewAllCountry = () => {
    router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}`);
  };

  // Helper: City listing count
  const getCityCount = (cityName) => {
    if (!internalSummary?.cities || !effectiveCountry) return 0;
    const countryMap = internalSummary.cities[effectiveCountry] || {};
    return countryMap[cityName] || countryMap[cityName.toLowerCase()] || 0;
  };

  // Helper: Category listing count
  const getCategoryCount = (categoryName) => {
    if (!internalSummary?.categories || !effectiveCountry) return 0;
    const countryMap = internalSummary.categories[effectiveCountry] || {};
    return countryMap[categoryName] || 0;
  };

  // Helper: City Image with reliable fallback
  const getCityImage = (cityName) => {
    return CITY_IMAGES[cityName] || COUNTRY_FALLBACKS[effectiveCountry] || COUNTRY_FALLBACKS.Pakistan;
  };

  return (
    <div
      aria-label="Browse Section"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 mb-8 transition-all duration-300"
    >
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 1: BROWSE BY COUNTRY (Horizontal Reference Style Cards)     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {!effectiveCountry && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Browse by Country
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Select a country to explore local cities and verified business categories
              </p>
            </div>
            {!isHomePage && (selectedCountry || selectedCity || selectedCategory) && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                aria-label="Clear browse selection"
              >
                <RotateCcw size={12} />
                Clear Selection
              </button>
            )}
          </div>

          {/* Grid: 3 cards on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COUNTRIES.map((c) => {
              const info = COUNTRY_DETAILS[c] || { name: c, description: '', image: '', FlagComponent: null };
              const Flag = info.FlagComponent;
              const count = internalSummary?.countries?.[c] ?? 0;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 text-left w-full group cursor-pointer"
                  aria-label={`Browse businesses in ${c}`}
                >
                  {/* Left: 100x100px rounded image */}
                  <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-xs">
                    <img
                      src={info.image}
                      alt={info.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = COUNTRY_FALLBACKS[c] || COUNTRY_FALLBACKS.Pakistan;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-sm shadow-xs border border-white/60">
                      {Flag && <Flag />}
                    </div>
                  </div>

                  {/* Right: Title, description, listings count */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {info.name}
                      </h4>
                      <ArrowRight size={15} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    <p className="text-xs sm:text-[13px] text-slate-500 leading-snug line-clamp-2 mt-1">
                      {info.description}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          count > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {count} {count === 1 ? 'Listing' : 'Listings'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* AFTER COUNTRY SELECT: TWO STACKED SECTIONS DIRECTLY                */}
      {/* Section 1: Browse by City                                         */}
      {/* Section 2: Browse by Category                                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {effectiveCountry && (
        <div className="space-y-10">
          {/* Top Country Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
                  {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                </div>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Browse {effectiveCountry}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing cities and business categories in {effectiveCountry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleViewAllCountry}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                aria-label={`View all listings in ${effectiveCountry}`}
              >
                <span>View All {effectiveCountry} Listings</span>
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                onClick={handleResetCountry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                aria-label="Change country"
              >
                <ChevronLeft size={14} />
                Change Country
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* 1. FIRST SECTION: BROWSE BY CITY                                */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Browse by City</span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {allCountryCities.length} Cities
                  </span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Explore businesses in popular cities across {effectiveCountry}
                </p>
              </div>

              {/* City quick filter search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder={`Search ${allCountryCities.length} cities...`}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  aria-label={`Search city in ${effectiveCountry}`}
                />
              </div>
            </div>

            {/* City Grid: Reference Style (Image Left, Text Right, 3 cols desktop, 2 cols tablet, 1 col mobile) */}
            {displayedCities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No cities found matching &quot;{citySearch}&quot; in {effectiveCountry}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedCities.map((cityName) => {
                  const count = getCityCount(cityName);
                  const isSelected = selectedCity.toLowerCase() === cityName.toLowerCase();
                  const cityImg = getCityImage(cityName);

                  return (
                    <button
                      key={cityName}
                      type="button"
                      onClick={() => handleCityClick(cityName)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left w-full group cursor-pointer bg-white ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20 shadow-sm'
                          : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5'
                      }`}
                      aria-label={`Select city ${cityName} in ${effectiveCountry}`}
                    >
                      {/* Left: 100x100px rounded image */}
                      <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-xs">
                        <img
                          src={cityImg}
                          alt={cityName}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = COUNTRY_FALLBACKS[effectiveCountry] || COUNTRY_FALLBACKS.Pakistan;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Right: City Name (bold), Description, Listings count */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {cityName}
                          </h5>
                          {isSelected ? (
                            <Check size={16} className="text-blue-600 shrink-0" />
                          ) : (
                            <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                          )}
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-500 leading-snug line-clamp-2 mt-1">
                          Businesses in {cityName}, {effectiveCountry}
                        </p>

                        <div className="mt-2.5 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              count > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {count} {count === 1 ? 'business' : 'businesses'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Show all / Show fewer toggle when not searching */}
            {!citySearch && filteredCities.length > 12 && (
              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => setShowAllCities((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors cursor-pointer border border-blue-200"
                >
                  {showAllCities ? (
                    <>
                      <span>Show Fewer Cities</span>
                      <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      <span>View All {filteredCities.length} Cities in {effectiveCountry}</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* 2. SECOND SECTION: BROWSE BY CATEGORY                           */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div>
            <div className="mb-4">
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Browse by Category</span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  13 Categories
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Explore local services and companies across all 13 industries in {effectiveCountry}
              </p>
            </div>

            {/* Category Grid: Reference Style (Image Left, Text Right, 3 cols desktop, 2 cols tablet, 1 col mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES_LIST.map((cat) => {
                const count = getCategoryCount(cat.name);
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left w-full group cursor-pointer bg-white ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20 shadow-sm'
                        : 'border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5'
                    }`}
                    aria-label={`Select category ${cat.name} in ${effectiveCountry}`}
                  >
                    {/* Left: 100x100px rounded image */}
                    <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-xs">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = COUNTRY_FALLBACKS[effectiveCountry] || COUNTRY_FALLBACKS.Pakistan;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Right: Category Title (bold), exact description, Listings count */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {cat.name}
                        </h5>
                        {isSelected ? (
                          <Check size={16} className="text-indigo-600 shrink-0" />
                        ) : (
                          <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                        )}
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-500 leading-snug line-clamp-2 mt-1">
                        {cat.description}
                      </p>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            count > 0
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {count} {count === 1 ? 'business' : 'businesses'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

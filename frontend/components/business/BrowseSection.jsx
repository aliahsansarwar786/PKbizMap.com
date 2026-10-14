'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { businessAPI } from '@/lib/api';
import { COUNTRIES, getCities } from '@/data/locations';
import {
  MapPin,
  Tag,
  ChevronLeft,
  RotateCcw,
  Search,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Monitor,
  Home,
  UtensilsCrossed,
  Heart,
  GraduationCap,
  Car,
  ShoppingBag,
  HardHat,
  DollarSign,
  Plane,
  Briefcase,
  Layers,
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

const CATEGORY_DETAILS = {
  IT: {
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
    icon: Monitor,
  },
  'Real Estate': {
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80',
    icon: Home,
  },
  Restaurant: {
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    icon: UtensilsCrossed,
  },
  Healthcare: {
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80',
    icon: Heart,
  },
  Education: {
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80',
    icon: GraduationCap,
  },
  Automotive: {
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80',
    icon: Car,
  },
  Retail: {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
    icon: ShoppingBag,
  },
  Construction: {
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80',
    icon: HardHat,
  },
  Finance: {
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80',
    icon: DollarSign,
  },
  Beauty: {
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
    icon: Sparkles,
  },
  Travel: {
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80',
    icon: Plane,
  },
  'Professional Services': {
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80',
    icon: Briefcase,
  },
  Other: {
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80',
    icon: Layers,
  },
};

function PakistanFlag() {
  return (
    <svg viewBox="0 0 900 600" className="w-6 h-4 rounded-xs shadow-sm inline-block" aria-hidden="true">
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
    <svg viewBox="0 0 1200 600" className="w-6 h-4 rounded-xs shadow-sm inline-block" aria-hidden="true">
      <rect width="1200" height="200" y="0" fill="#00732f" />
      <rect width="1200" height="200" y="200" fill="#ffffff" />
      <rect width="1200" height="200" y="400" fill="#000000" />
      <rect width="300" height="600" x="0" fill="#ff0000" />
    </svg>
  );
}

function USAFlag() {
  return (
    <svg viewBox="0 0 7410 3900" className="w-6 h-4 rounded-xs shadow-sm inline-block" aria-hidden="true">
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
    image: 'https://images.unsplash.com/photo-1588718904583-62b77dce7803?w=800&q=80',
    subtitle: 'Lahore, Karachi, Islamabad, Multan & 168+ cities',
  },
  UAE: {
    name: 'UAE',
    FlagComponent: UAEFlag,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    subtitle: 'Dubai, Abu Dhabi, Sharjah & 40+ cities',
  },
  USA: {
    name: 'USA',
    FlagComponent: USAFlag,
    image: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=800&q=80',
    subtitle: 'New York, Los Angeles, Chicago & 277+ cities',
  },
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

  // Navigation view state:
  // 'country' (Level 1)
  // 'options' (Level 2: City vs Category)
  // 'city' (Level 3A: City grid)
  // 'category' (Level 3B: Category grid)
  const [activeView, setActiveView] = useState('country');
  const [localCountry, setLocalCountry] = useState(selectedCountry || '');
  const [citySearch, setCitySearch] = useState('');
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

  // Sync with external selectedCountry / city / category changes (e.g. from Filter Bar on /businesses)
  useEffect(() => {
    if (!isHomePage) {
      setLocalCountry(selectedCountry);
      if (!selectedCountry) {
        setActiveView('country');
      } else if (selectedCity) {
        setActiveView('city');
      } else if (selectedCategory) {
        setActiveView('category');
      } else if (activeView === 'country' && selectedCountry) {
        setActiveView('options');
      }
    }
  }, [isHomePage, selectedCountry, selectedCity, selectedCategory, activeView]);

  const effectiveCountry = isHomePage ? localCountry : selectedCountry;

  // Cities for the selected country (from locations.json)
  const countryCities = useMemo(() => {
    if (!effectiveCountry) return [];
    return getCities(effectiveCountry);
  }, [effectiveCountry]);

  // Filtered cities based on quick search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return countryCities;
    const q = citySearch.trim().toLowerCase();
    return countryCities.filter((c) => c.toLowerCase().includes(q));
  }, [countryCities, citySearch]);

  // Handlers
  const handleCountryClick = (country) => {
    if (isHomePage) {
      setLocalCountry(country);
      setActiveView('options');
    } else {
      if (onSelectCountry) onSelectCountry(country);
      setActiveView('options');
    }
  };

  const handleBackToCountries = () => {
    if (isHomePage) {
      setLocalCountry('');
      setActiveView('country');
    } else {
      if (onSelectCountry) onSelectCountry('');
      setActiveView('country');
    }
  };

  const handleBackToOptions = () => {
    setActiveView('options');
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

  const handleCategoryClick = (catName) => {
    if (isHomePage) {
      router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}&category=${encodeURIComponent(catName)}`);
    } else {
      if (selectedCategory === catName) {
        if (onSelectCategory) onSelectCategory('');
      } else {
        if (onSelectCategory) onSelectCategory(catName);
      }
    }
  };

  const handleViewAllCountryListings = () => {
    router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}`);
  };

  // Helper to fetch listing count for a city safely
  const getCityCount = (cityName) => {
    if (!internalSummary?.cities || !effectiveCountry) return 0;
    const countryMap = internalSummary.cities[effectiveCountry] || {};
    return countryMap[cityName] || countryMap[cityName.toLowerCase()] || 0;
  };

  // Helper to fetch listing count for a category safely
  const getCategoryCount = (catName) => {
    if (!internalSummary?.categories || !effectiveCountry) return 0;
    const countryMap = internalSummary.categories[effectiveCountry] || {};
    return countryMap[catName] || 0;
  };

  return (
    <div
      aria-label="Interactive Browse Section"
      className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 mb-8 transition-all duration-300"
    >
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 1: BROWSE BY COUNTRY (Rich cards with landmark images)       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'country' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Browse by Country
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Select a country to view local cities and verified business categories
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COUNTRIES.map((c) => {
              const info = COUNTRY_DETAILS[c] || { name: c, subtitle: '', image: '', FlagComponent: null };
              const Flag = info.FlagComponent;
              const count = internalSummary?.countries?.[c] ?? 0;
              const isSelected = effectiveCountry === c;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCountryClick(c)}
                  className={`group relative text-left rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between bg-white ${
                    isSelected
                      ? 'border-blue-600 shadow-xl ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1'
                  }`}
                  aria-label={`Browse businesses in ${c}`}
                >
                  {/* Card Cover Image with Zoom Effect */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={info.image}
                      alt={info.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent pointer-events-none" />

                    {/* Flag Badge on Top Left */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-white/50">
                      {Flag && <Flag />}
                      <span className="text-xs font-bold text-slate-900">{info.name}</span>
                    </div>

                    {/* Listing Count Badge on Top Right */}
                    <div className="absolute top-3.5 right-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold shadow-md backdrop-blur-md transition-colors ${
                          count > 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900/60 text-white/90 border border-white/20'
                        }`}
                      >
                        {count} {count === 1 ? 'Listing' : 'Listings'}
                      </span>
                    </div>

                    {/* Country Title on Bottom of Image */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Explore</span>
                        <h4 className="text-2xl font-black text-white leading-tight drop-shadow-sm">
                          {info.name}
                        </h4>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Card Description */}
                  <div className="p-4 bg-white flex flex-col justify-between flex-1 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                      {info.subtitle}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                      <span>Explore cities & categories</span>
                      <span className="text-[11px] text-slate-400 font-normal">Click to browse &rarr;</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 2: AFTER COUNTRY SELECT (Choose City or Category)          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'options' && effectiveCountry && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200">
                  {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                </div>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Browse {effectiveCountry}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Explore businesses by city or browse all 13 categories in {effectiveCountry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleViewAllCountryListings}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                aria-label={`View all listings in ${effectiveCountry}`}
              >
                <span>View All {effectiveCountry} Listings</span>
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                onClick={handleBackToCountries}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                aria-label="Change country"
              >
                <ChevronLeft size={14} />
                Change Country
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Option 1: Browse by City */}
            <button
              type="button"
              onClick={() => setActiveView('city')}
              className="group relative text-left rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              aria-label={`Browse by City in ${effectiveCountry}`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&q=80"
                  alt="Browse by City"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">All Locations</span>
                      <h4 className="text-xl font-bold text-white leading-tight">Browse by City</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-200 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    {countryCities.length} Cities
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-white">
                <p className="text-xs text-slate-500 line-clamp-1">
                  Explore {countryCities.slice(0, 4).join(', ')}, and more in {effectiveCountry}.
                </p>
                <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1.5 transition-transform shrink-0 ml-2" />
              </div>
            </button>

            {/* Option 2: Browse by Category */}
            <button
              type="button"
              onClick={() => setActiveView('category')}
              className="group relative text-left rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              aria-label={`Browse by Category in ${effectiveCountry}`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80"
                  alt="Browse by Category"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Tag size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">All Sectors</span>
                      <h4 className="text-xl font-bold text-white leading-tight">Browse by Category</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-200 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    {CATEGORIES.length} Categories
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-white">
                <p className="text-xs text-slate-500 line-clamp-1">
                  IT, Real Estate, Restaurant, Healthcare, Retail & more.
                </p>
                <ArrowRight size={16} className="text-indigo-600 group-hover:translate-x-1.5 transition-transform shrink-0 ml-2" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 3A: BROWSE BY CITY                                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'city' && effectiveCountry && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200">
                  {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                </div>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Cities in {effectiveCountry}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing {countryCities.length} cities in {effectiveCountry}
                  {selectedCity && (
                    <span className="font-semibold text-blue-600"> • Selected: {selectedCity}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBackToOptions}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Back to options"
              >
                <ChevronLeft size={13} />
                Back to Options
              </button>
              <button
                type="button"
                onClick={handleBackToCountries}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Change country"
              >
                Change Country
              </button>
              {!isHomePage && selectedCity && (
                <button
                  type="button"
                  onClick={() => onSelectCity && onSelectCity('')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear selected city"
                >
                  <RotateCcw size={12} />
                  Clear City
                </button>
              )}
            </div>
          </div>

          {/* Quick Search within country's cities */}
          <div className="relative mb-4 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder={`Search in ${countryCities.length} cities...`}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              aria-label={`Search city in ${effectiveCountry}`}
            />
          </div>

          {/* City Cards Grid */}
          {filteredCities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No cities match &quot;{citySearch}&quot; in {effectiveCountry}.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {filteredCities.map((cityName) => {
                  const count = getCityCount(cityName);
                  const isSelected = selectedCity.toLowerCase() === cityName.toLowerCase();

                  return (
                    <button
                      key={cityName}
                      type="button"
                      onClick={() => handleCityClick(cityName)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-500/30'
                          : count > 0
                          ? 'border-blue-200 bg-blue-50/40 hover:border-blue-500 hover:bg-white hover:shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      aria-label={`Select city ${cityName} in ${effectiveCountry}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isSelected ? 'text-blue-700' : 'text-slate-900'
                          }`}
                          title={cityName}
                        >
                          {cityName}
                        </span>
                        {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                      </div>

                      <span
                        className={`text-[11px] font-medium ${
                          count > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {count} {count === 1 ? 'biz' : 'bizs'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 3B: BROWSE BY CATEGORY (Cards with real images)             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'category' && effectiveCountry && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200">
                  {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                </div>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Categories in {effectiveCountry}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Browse verified businesses by industry in {effectiveCountry}
                  {selectedCategory && (
                    <span className="font-semibold text-indigo-600"> • Selected: {selectedCategory}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBackToOptions}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Back to options"
              >
                <ChevronLeft size={13} />
                Back to Options
              </button>
              <button
                type="button"
                onClick={handleBackToCountries}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Change country"
              >
                Change Country
              </button>
              {!isHomePage && selectedCategory && (
                <button
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory('')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear selected category"
                >
                  <RotateCcw size={12} />
                  Clear Category
                </button>
              )}
            </div>
          </div>

          {/* Category Cards Grid with Real Thumbnail Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((catName) => {
              const info = CATEGORY_DETAILS[catName] || { image: '', icon: Layers };
              const Icon = info.icon || Layers;
              const count = getCategoryCount(catName);
              const isSelected = selectedCategory === catName;

              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => handleCategoryClick(catName)}
                  className={`group text-left p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 overflow-hidden bg-white ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/30'
                      : count > 0
                      ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70 hover:shadow-sm'
                  }`}
                  aria-label={`Select category ${catName} in ${effectiveCountry}`}
                >
                  {/* Category Image Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 shadow-xs border border-slate-100">
                    <img
                      src={info.image}
                      alt={catName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/15 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-xs">
                      <Icon size={12} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-bold truncate transition-colors ${
                        isSelected ? 'text-indigo-700' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}
                    >
                      {catName}
                    </h4>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        count > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {count} {count === 1 ? 'business' : 'businesses'}
                    </p>
                  </div>

                  {isSelected ? (
                    <Check size={16} className="text-indigo-600 shrink-0 mr-1" />
                  ) : (
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mr-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

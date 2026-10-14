'use client';

import { useState, useMemo, useEffect } from 'react';
import { COUNTRIES, getCities } from '@/data/locations';
import {
  MapPin,
  Tag,
  ChevronLeft,
  RotateCcw,
  Search,
  Check,
  ArrowRight,
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
  Building2,
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

const CATEGORY_ICONS = {
  IT: Monitor,
  'Real Estate': Home,
  Restaurant: UtensilsCrossed,
  Healthcare: Heart,
  Education: GraduationCap,
  Automotive: Car,
  Retail: ShoppingBag,
  Construction: HardHat,
  Finance: DollarSign,
  Beauty: Sparkles,
  Travel: Plane,
  'Professional Services': Briefcase,
  Other: Layers,
};

const COUNTRY_DETAILS = {
  Pakistan: {
    name: 'Pakistan',
    flag: '🇵🇰',
    subtitle: 'Karachi, Lahore, Islamabad, Multan & more',
  },
  UAE: {
    name: 'UAE',
    flag: '🇦🇪',
    subtitle: 'Dubai, Abu Dhabi, Sharjah & more',
  },
  USA: {
    name: 'USA',
    flag: '🇺🇸',
    subtitle: 'New York, Los Angeles, Chicago & more',
  },
};

export default function BrowseSection({
  selectedCountry = '',
  selectedCity = '',
  selectedCategory = '',
  onSelectCountry,
  onSelectCity,
  onSelectCategory,
  onClearAll,
  summary = null,
}) {
  // Navigation view state:
  // 'country' (Level 1)
  // 'options' (Level 2: City vs Category)
  // 'city' (Level 3A: City grid)
  // 'category' (Level 3B: Category grid)
  const [activeView, setActiveView] = useState('country');
  const [citySearch, setCitySearch] = useState('');

  // Sync activeView with external selectedCountry / city / category changes (e.g. from Filter Bar)
  useEffect(() => {
    if (!selectedCountry) {
      setActiveView('country');
    } else if (selectedCity) {
      setActiveView('city');
    } else if (selectedCategory) {
      setActiveView('category');
    } else if (activeView === 'country' && selectedCountry) {
      setActiveView('options');
    }
  }, [selectedCountry, selectedCity, selectedCategory]);

  // Cities for the selected country (from locations.json)
  const countryCities = useMemo(() => {
    if (!selectedCountry) return [];
    return getCities(selectedCountry);
  }, [selectedCountry]);

  // Filtered cities based on quick search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return countryCities;
    const q = citySearch.trim().toLowerCase();
    return countryCities.filter((c) => c.toLowerCase().includes(q));
  }, [countryCities, citySearch]);

  // Handlers
  const handleCountryClick = (country) => {
    onSelectCountry(country);
    setActiveView('options');
  };

  const handleBackToCountries = () => {
    onSelectCountry(''); // Reset country
    setActiveView('country');
  };

  const handleBackToOptions = () => {
    setActiveView('options');
  };

  const handleCityClick = (cityName) => {
    if (selectedCity === cityName) {
      onSelectCity(''); // Toggle off if already selected
    } else {
      onSelectCity(cityName);
    }
  };

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      onSelectCategory(''); // Toggle off if already selected
    } else {
      onSelectCategory(catName);
    }
  };

  // Helper to fetch listing count for a city safely
  const getCityCount = (cityName) => {
    if (!summary?.cities || !selectedCountry) return 0;
    const countryMap = summary.cities[selectedCountry] || {};
    return countryMap[cityName] || countryMap[cityName.toLowerCase()] || 0;
  };

  // Helper to fetch listing count for a category safely
  const getCategoryCount = (catName) => {
    if (!summary?.categories || !selectedCountry) return 0;
    const countryMap = summary.categories[selectedCountry] || {};
    return countryMap[catName] || 0;
  };

  return (
    <section
      aria-label="Interactive Browse Section"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 mb-8 transition-all duration-300"
    >
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 1: BROWSE BY COUNTRY                                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'country' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Browse by Country
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Select a country to explore local cities and business categories
              </p>
            </div>
            {(selectedCountry || selectedCity || selectedCategory) && (
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COUNTRIES.map((c) => {
              const info = COUNTRY_DETAILS[c] || { name: c, flag: '🌐', subtitle: '' };
              const count = summary?.countries?.[c] ?? 0;
              const isSelected = selectedCountry === c;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCountryClick(c)}
                  className={`group relative text-left p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/30'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-1'
                  }`}
                  aria-label={`Browse businesses in ${c}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-4xl filter drop-shadow-sm select-none" role="img" aria-label={c}>
                      {info.flag}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        count > 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}
                    >
                      {count} {count === 1 ? 'Listing' : 'Listings'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                      <span>{info.name}</span>
                      <ArrowRight
                        size={16}
                        className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                      />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {info.subtitle}
                    </p>
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
      {activeView === 'options' && selectedCountry && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label={selectedCountry}>
                {COUNTRY_DETAILS[selectedCountry]?.flag || '🌐'}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Browse {selectedCountry}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Explore by cities or categories in {selectedCountry}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToCountries}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                aria-label="Change country"
              >
                <ChevronLeft size={14} />
                Change Country
              </button>
              {(selectedCity || selectedCategory) && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear active filters"
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Option 1: Browse by City */}
            <button
              type="button"
              onClick={() => setActiveView('city')}
              className="group text-left p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50/40 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              aria-label={`Browse by City in ${selectedCountry}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <MapPin size={24} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full">
                  {countryCities.length} Cities
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                  <span>Browse by City</span>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1.5 transition-all"
                  />
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Find verified businesses in {countryCities.slice(0, 3).join(', ')}, and {countryCities.length - 3}+ other cities in {selectedCountry}.
                </p>
              </div>
            </button>

            {/* Option 2: Browse by Category */}
            <button
              type="button"
              onClick={() => setActiveView('category')}
              className="group text-left p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/40 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              aria-label={`Browse by Category in ${selectedCountry}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Tag size={24} />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full">
                  {CATEGORIES.length} Categories
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                  <span>Browse by Category</span>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition-all"
                  />
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Discover services across IT, Real Estate, Restaurants, Healthcare, Retail, and more in {selectedCountry}.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 3A: BROWSE BY CITY                                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'city' && selectedCountry && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label={selectedCountry}>
                {COUNTRY_DETAILS[selectedCountry]?.flag || '🌐'}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Cities in {selectedCountry}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Showing {countryCities.length} cities in {selectedCountry}
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
              {selectedCity && (
                <button
                  type="button"
                  onClick={() => onSelectCity('')}
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
              aria-label={`Search city in ${selectedCountry}`}
            />
          </div>

          {/* City Cards Grid */}
          {filteredCities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No cities match &quot;{citySearch}&quot; in {selectedCountry}.
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
                          ? 'border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:bg-white hover:shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      aria-label={`Select city ${cityName} in ${selectedCountry}`}
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
      {/* LEVEL 3B: BROWSE BY CATEGORY                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'category' && selectedCountry && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label={selectedCountry}>
                {COUNTRY_DETAILS[selectedCountry]?.flag || '🌐'}
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Categories in {selectedCountry}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Browse by industry in {selectedCountry}
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
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => onSelectCategory('')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Clear selected category"
                >
                  <RotateCcw size={12} />
                  Clear Category
                </button>
              )}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5">
            {CATEGORIES.map((catName) => {
              const Icon = CATEGORY_ICONS[catName] || Layers;
              const count = getCategoryCount(catName);
              const isSelected = selectedCategory === catName;

              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => handleCategoryClick(catName)}
                  className={`group text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/30'
                      : count > 0
                      ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70'
                  }`}
                  aria-label={`Select category ${catName} in ${selectedCountry}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : count > 0
                        ? 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-bold truncate transition-colors ${
                        isSelected ? 'text-indigo-700' : 'text-slate-900 group-hover:text-indigo-600'
                      }`}
                    >
                      {catName}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        count > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {count} {count === 1 ? 'business' : 'businesses'}
                    </p>
                  </div>

                  {isSelected && <Check size={16} className="text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

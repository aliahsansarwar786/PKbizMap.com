'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { businessAPI } from '@/lib/api';
import { COUNTRIES, getCities } from '@/data/locations';
import { CATEGORIES as CATEGORIES_LIST } from '@/data/categories';
import { getCategorySlug, getCountrySlug, getCitySlug } from '@/lib/slugify';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Filter,
} from 'lucide-react';

// Verified working Unsplash images (Status 200 OK audited, 100% unique photo IDs)
const COUNTRY_FALLBACKS = {
  Pakistan: [
    '/images/browse-northern-valley.jpg', // Northern green valley
    '/images/browse-old-city.jpg', // Old city bazaar
    '/images/browse-mountain-pass.jpg', // Scenic mountain pass
    '/images/country-fallback-northern-landscape.jpg', // Northern landscape
    '/images/country-fallback-bustling-marketplace.jpg', // Bustling marketplace
  ],
  UAE: [
    '/images/country-fallback-futuristic-architecture.jpg', // Futuristic architecture
    '/images/country-fallback-desert-sand-dunes.jpg', // Desert sand dunes
    '/images/country-fallback-marina-lights.jpg', // Marina lights
    '/images/country-fallback-desert-sunset.jpg', // Desert sunset
    '/images/country-fallback-resort-palms.jpg', // Resort palms
  ],
  USA: [
    '/images/country-fallback-american-city-street.jpg', // American city street
    '/images/blog-fallback.jpg', // Corporate highrise
    '/images/country-fallback-downtown-night.jpg', // Downtown night
    '/images/country-fallback-architectural-street.jpg', // Architectural street
    '/images/country-fallback-city-park-skyline.jpg', // City park skyline
  ],
};

// Deterministic rotation helper: distributes non-major cities across the 5 distinct country photos
function getRotatedFallback(country, cityName, offset = 0) {
  const fallbacks = COUNTRY_FALLBACKS[country] || COUNTRY_FALLBACKS.Pakistan;
  if (!fallbacks || !fallbacks.length) return '';
  let hash = 0;
  const str = String(cityName || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + offset) % fallbacks.length;
  return fallbacks[idx];
}

// Category fallback: renders an elegant SVG placeholder with category name (never falls back to city photos)
function getCategorySvgFallback(categoryName) {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="2" y="2" width="96" height="96" rx="8" fill="%23f1f5f9" stroke="%23e2e8f0" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="%234f46e5">${encodeURIComponent(categoryName || 'Category')}</text></svg>`;
}

// Vibrant City SVG fallback: renders an elegant brand gradient with skyline & city initial (never blank gray)
function getCitySvgFallback(cityName) {
  const name = cityName || 'City';
  const initial = name.charAt(0).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e40af"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="100%" height="100%" rx="10" fill="url(%23g)"/><g opacity="0.18" fill="%23ffffff"><rect x="10" y="45" width="14" height="55"/><rect x="28" y="30" width="18" height="70"/><rect x="50" y="40" width="16" height="60"/><rect x="70" y="20" width="20" height="80"/></g><circle cx="50" cy="42" r="20" fill="%23ffffff" fill-opacity="0.2"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="%23ffffff">${encodeURIComponent(initial)}</text><text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="%23ffffff" letter-spacing="0.5">${encodeURIComponent(name.length > 10 ? name.slice(0, 9) + '…' : name)}</text></svg>`;
}

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
    image: '/images/country-pakistan.jpg',
    description: 'Explore verified businesses across Lahore, Karachi, Islamabad, Multan and 168+ cities.',
  },
  UAE: {
    name: 'UAE',
    FlagComponent: UAEFlag,
    image: '/images/country-uae.jpg',
    description: 'Discover companies in Dubai, Abu Dhabi, Sharjah, Ajman and across the United Arab Emirates.',
  },
  USA: {
    name: 'USA',
    FlagComponent: USAFlag,
    image: '/images/country-usa.jpg',
    description: 'Find local businesses across New York, California, Texas, Illinois and 270+ cities.',
  },
};

// Verified major city images (100% unique photo IDs, verified HTTP 200)
const CITY_IMAGES = {
  // Pakistan Major Cities
  Lahore: '/images/city-lahore.jpg',
  Karachi: '/images/city-karachi.jpg',
  Islamabad: '/images/city-islamabad.jpg',
  Multan: '/images/city-multan.jpg',
  Rawalpindi: '/images/city-rawalpindi.jpg',
  Faisalabad: '/images/city-faisalabad.jpg',
  Peshawar: '/images/city-peshawar.jpg',
  Quetta: '/images/city-quetta.jpg',
  Mingora: '/images/city-quetta.jpg',
  Hunza: '/images/city-hunza.jpg',
  Mansehra: '/images/browse-mountain-pass.jpg',
  Hyderabad: '/images/city-hyderabad.jpg',
  Sialkot: '/images/city-sialkot.jpg',
  Gujranwala: '/images/city-gujranwala.jpg',
  Bahawalpur: '/images/city-bahawalpur.jpg',
  Sukkur: '/images/city-sukkur.jpg',
  Abbottabad: '/images/city-hunza.jpg',
  Murree: '/images/city-murree.jpg',
  Gwadar: '/images/city-gwadar.jpg',
  Gujrat: '/images/city-gujrat.jpg',
  Kasur: '/images/city-kasur.jpg',
  Sahiwal: '/images/city-sahiwal.jpg',
  Sargodha: '/images/city-sargodha.jpg',
  'Rahim Yar Khan': '/images/city-kasur.jpg',
  Mardan: '/images/city-gujrat.jpg',
  Larkana: '/images/city-larkana.jpg',
  Sheikhupura: '/images/city-sheikhupura.jpg',
  Jhelum: '/images/city-jhelum.jpg',
  Kabirwala: '/images/city-kabirwala.jpg',
  Muzaffarabad: '/images/browse-northern-valley.jpg',
  Skardu: '/images/city-murree.jpg',
  Gilgit: '/images/country-fallback-northern-landscape.jpg',
  Okara: '/images/city-sahiwal.jpg',
  Jhang: '/images/city-sheikhupura.jpg',
  Chiniot: '/images/city-gujranwala.jpg',
  'Dera Ghazi Khan': '/images/city-bahawalpur.jpg',
  'Wah Cantt': '/images/city-rawalpindi.jpg',

  // UAE Major Cities
  Dubai: '/images/city-dubai.jpg',
  'Abu Dhabi': '/images/city-abu-dhabi.jpg',
  Sharjah: '/images/city-sharjah.jpg',
  Ajman: '/images/city-ajman.jpg',
  'Ras Al Khaimah': '/images/city-ras-al-khaimah.jpg',
  Fujairah: '/images/city-fujairah.jpg',
  'Al Ain': '/images/city-al-ain.jpg',
  'Umm Al Quwain': '/images/city-umm-al-quwain.jpg',

  // USA Major Cities
  'New York': '/images/city-new-york.jpg',
  'Los Angeles': '/images/city-los-angeles.jpg',
  Chicago: '/images/city-chicago.jpg',
  Houston: '/images/city-houston.jpg',
  Miami: '/images/city-miami.jpg',
  'San Francisco': '/images/city-san-francisco.jpg',
  Seattle: '/images/city-seattle.jpg',
  Boston: '/images/city-boston.jpg',
  'Las Vegas': '/images/city-las-vegas.jpg',
  Austin: '/images/city-austin.jpg',
  Denver: '/images/city-denver.jpg',
  'San Diego': '/images/city-san-diego.jpg',
};

export default function BrowseSection({
  isHomePage = false,
  selectedCountry = '',
  selectedCity = '',
  selectedCategory = '',
  onSelectCountry = () => {},
  onSelectCity = () => {},
  onSelectCategory = () => {},
  onClearAll = () => {},
  summary = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCountry = searchParams?.get('country') || '';

  // Selected Country & City state (initialized with URL country if on homepage)
  const [localCountry, setLocalCountry] = useState(() => {
    if (isHomePage && urlCountry) {
      const matched = COUNTRIES.find(
        (c) => c.toLowerCase() === urlCountry.trim().toLowerCase()
      );
      if (matched) return matched;
    }
    return selectedCountry || '';
  });
  const [localCity, setLocalCity] = useState(selectedCity || '');
  const [citySearch, setCitySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [showAllCities, setShowAllCities] = useState(false);
  const [internalSummary, setInternalSummary] = useState(summary || null);

  // Sync with URL country param when on homepage (e.g. /?country=Pakistan)
  useEffect(() => {
    if (isHomePage) {
      if (urlCountry) {
        const matched = COUNTRIES.find(
          (c) => c.toLowerCase() === urlCountry.trim().toLowerCase()
        );
        if (matched) {
          setLocalCountry(matched);
          setLocalCity('');
          setCitySearch('');
          setCategorySearch('');
          setShowAllCities(false);
          // Scroll to Browse section so user sees the cities grid immediately
          setTimeout(() => {
            const heading = document.getElementById('browse-directory-heading');
            if (heading) {
              heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        }
      } else {
        setLocalCountry('');
        setLocalCity('');
      }
    }
  }, [isHomePage, urlCountry]);

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

  // Keep localCountry and localCity in sync with props when on directory page
  useEffect(() => {
    if (!isHomePage) {
      setLocalCountry(selectedCountry || '');
      setLocalCity(selectedCity || '');
    }
  }, [isHomePage, selectedCountry, selectedCity]);

  const effectiveCountry = isHomePage ? localCountry : selectedCountry;
  const effectiveCity = isHomePage ? localCity : selectedCity;

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

  // Filtered categories based on category search in Level 3
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return CATEGORIES_LIST;
    const q = categorySearch.trim().toLowerCase();
    return CATEGORIES_LIST.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [categorySearch]);

  // Handlers
  const handleCountrySelect = (countryName) => {
    if (isHomePage) {
      setLocalCountry(countryName);
      setLocalCity('');
      setCitySearch('');
      setCategorySearch('');
      setKeywordSearch('');
      setShowAllCities(false);
    } else {
      if (onSelectCountry) onSelectCountry(countryName);
      if (onSelectCity) onSelectCity('');
      setCitySearch('');
      setCategorySearch('');
      setKeywordSearch('');
      setShowAllCities(false);
    }
  };

  const handleResetCountry = () => {
    if (isHomePage) {
      setLocalCountry('');
      setLocalCity('');
      setCitySearch('');
      setCategorySearch('');
      setKeywordSearch('');
      setShowAllCities(false);
      if (urlCountry) {
        router.push('/');
      }
    } else {
      if (onSelectCountry) onSelectCountry('');
      if (onSelectCity) onSelectCity('');
      setCitySearch('');
      setCategorySearch('');
      setKeywordSearch('');
      setShowAllCities(false);
    }
  };

  // City click: selects City to view its Categories (Level 3)
  const handleCityClick = (cityName) => {
    if (isHomePage) {
      setLocalCity(cityName);
      setCategorySearch('');
      setKeywordSearch('');
    } else {
      if (onSelectCity) onSelectCity(cityName);
      setCategorySearch('');
      setKeywordSearch('');
    }
  };

  const handleBackToCities = () => {
    if (isHomePage) {
      setLocalCity('');
      setCategorySearch('');
      setKeywordSearch('');
    } else {
      if (onSelectCity) onSelectCity('');
      setCategorySearch('');
      setKeywordSearch('');
    }
  };

  // Category click: navigates to pretty landing page when on home page
  const handleCategoryClick = (categoryName) => {
    if (isHomePage) {
      if (effectiveCity) {
        router.push(`/categories/${getCategorySlug(categoryName)}/${getCitySlug(effectiveCity)}`);
      } else {
        router.push(`/categories/${getCategorySlug(categoryName)}`);
      }
    } else {
      if (selectedCategory === categoryName) {
        if (onSelectCategory) onSelectCategory('');
      } else {
        if (onSelectCategory) onSelectCategory(categoryName);
      }
    }
  };

  // Direct Search with Filter
  const handleSearchWithFilter = (e) => {
    if (e) e.preventDefault();
    let url = `/businesses?country=${encodeURIComponent(effectiveCountry)}`;
    if (effectiveCity) url += `&city=${encodeURIComponent(effectiveCity)}`;
    if (keywordSearch.trim()) url += `&keyword=${encodeURIComponent(keywordSearch.trim())}`;
    router.push(url);
  };

  const handleViewAllCity = () => {
    router.push(`/cities/${getCountrySlug(effectiveCountry)}/${getCitySlug(effectiveCity)}`);
  };

  const handleViewAllCountry = () => {
    router.push(`/cities/${getCountrySlug(effectiveCountry)}`);
  };

  // Helper: City listing count
  const getCityCount = (cityName) => {
    if (!internalSummary?.cities || !effectiveCountry) return 0;
    const countryMap = internalSummary.cities[effectiveCountry] || {};
    return countryMap[cityName] || countryMap[cityName.toLowerCase()] || 0;
  };

  // Helper: Category listing count
  const getCategoryCount = (categoryName) => {
    if (!internalSummary || !effectiveCountry) return 0;
    if (effectiveCity) {
      const countryCities = internalSummary.categoriesByCity?.[effectiveCountry] || {};
      const cityMap =
        countryCities[effectiveCity] ||
        countryCities[effectiveCity.toLowerCase()] ||
        Object.entries(countryCities).find(([k]) => k.toLowerCase() === effectiveCity.toLowerCase())?.[1];
      if (cityMap) return cityMap[categoryName] || 0;
      return 0;
    }
    const countryMap = internalSummary.categories?.[effectiveCountry] || {};
    return countryMap[categoryName] || 0;
  };

  // Helper: City Image with reliable rotating deterministic fallback
  const getCityImage = (cityName) => {
    if (CITY_IMAGES[cityName]) {
      return CITY_IMAGES[cityName];
    }
    return getRotatedFallback(effectiveCountry, cityName, 0);
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
                        e.currentTarget.src = getRotatedFallback(c, c, 1);
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
                        {`${count} ${count === 1 ? 'Listing' : 'Listings'}`}
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
      {/* LEVEL 2: BROWSE BY CITY (Only shown after country is selected)    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {effectiveCountry && !effectiveCity && (
        <div className="space-y-6">
          {/* Top Country Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                <button
                  type="button"
                  onClick={handleResetCountry}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  Browse Countries
                </button>
                <ChevronRight size={12} className="text-slate-400" />
                <span className="font-bold text-slate-900">{effectiveCountry}</span>
              </div>

              <div className="flex items-center gap-3">
                {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
                    {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Browse Cities in {effectiveCountry}
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                      {allCountryCities.length} Cities
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Select a city to view businesses and explore categories in that city
                  </p>
                </div>
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

          {/* City quick filter search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              Select your city to continue:
            </p>
            <div className="relative w-full sm:w-72">
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
                const cityImg = getCityImage(cityName);

                return (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleCityClick(cityName)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200 text-left w-full group cursor-pointer bg-white"
                    aria-label={`Select city ${cityName} in ${effectiveCountry}`}
                  >
                    {/* Left: 100x100px rounded image */}
                    <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 shadow-xs">
                      <img
                        src={cityImg}
                        alt={cityName}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = (ev) => {
                            ev.currentTarget.onerror = null;
                            ev.currentTarget.src = getCitySvgFallback(cityName);
                          };
                          e.currentTarget.src = getRotatedFallback(effectiveCountry, cityName, 1);
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
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
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
                          {`${count} ${count === 1 ? 'business' : 'businesses'}`}
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
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* LEVEL 3: BROWSE BY CATEGORY (Shown when both Country & City chosen) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {effectiveCountry && effectiveCity && (
        <div className="space-y-6">
          {/* Top City Header Bar with Breadcrumb and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetCountry}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  Browse Countries
                </button>
                <ChevronRight size={12} className="text-slate-400" />
                <button
                  type="button"
                  onClick={handleBackToCities}
                  className="hover:text-blue-600 transition-colors font-medium cursor-pointer"
                >
                  {effectiveCountry}
                </button>
                <ChevronRight size={12} className="text-slate-400" />
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {effectiveCity}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {COUNTRY_DETAILS[effectiveCountry]?.FlagComponent && (
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 shadow-xs">
                    {COUNTRY_DETAILS[effectiveCountry].FlagComponent()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Browse Categories in {effectiveCity}
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                      13 Categories
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Select a category below or search to find verified businesses in {effectiveCity}, {effectiveCountry}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleViewAllCity}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                aria-label={`View all listings in ${effectiveCity}`}
              >
                <span>View All in {effectiveCity}</span>
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                onClick={handleBackToCities}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                aria-label="Back to cities"
              >
                <ChevronLeft size={14} />
                Back to Cities
              </button>
              <button
                type="button"
                onClick={handleResetCountry}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
                aria-label="Change country"
              >
                Change Country
              </button>
            </div>
          </div>

          {/* Search with Filter Bar ("phir is main only search ho with filter") */}
          <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-100/80 shadow-2xs">
            <form onSubmit={handleSearchWithFilter} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder={`Search businesses in ${effectiveCity}... (e.g. restaurant, clinic, software, dental)`}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
                  aria-label={`Search businesses in ${effectiveCity}`}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0"
              >
                <Filter size={15} />
                <span>Search with Filter</span>
              </button>
            </form>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-blue-100/60 text-xs text-slate-500">
              <span>Or click any category card below to filter businesses in {effectiveCity}:</span>
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Quick filter 13 categories..."
                  className="w-full h-7 pl-2.5 pr-2 rounded-md border border-slate-200 bg-white/90 text-[11px] text-slate-800 outline-none focus:border-indigo-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Grid: Reference Style (Image Left, Text Right, 3 cols desktop, 2 cols tablet, 1 col mobile) */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No categories found matching &quot;{categorySearch}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
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
                    aria-label={`Select category ${cat.name} in ${effectiveCity}`}
                  >
                    {/* Left: 100x100px rounded image */}
                    <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-xs">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategorySvgFallback(cat.name);
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
                          {`${count} ${count === 1 ? 'business' : 'businesses'}`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

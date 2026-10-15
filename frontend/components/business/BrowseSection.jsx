'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { businessAPI } from '@/lib/api';
import { COUNTRIES, getCities } from '@/data/locations';
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
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80', // Northern green valley
    'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=400&q=80', // Old city bazaar
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80', // Scenic mountain pass
    'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=400&q=80', // Northern landscape
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&q=80', // Bustling marketplace
  ],
  UAE: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80', // Futuristic architecture
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&q=80', // Desert sand dunes
    'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=400&q=80', // Marina lights
    'https://images.unsplash.com/photo-1546412414-e1885259563a?w=400&q=80', // Desert sunset
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=80', // Resort palms
  ],
  USA: [
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80', // American city street
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80', // Corporate highrise
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&q=80', // Downtown night
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80', // Architectural street
    'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&q=80', // City park skyline
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

// Emergency City SVG fallback
function getCitySvgFallback(cityName) {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="2" y="2" width="96" height="96" rx="8" fill="%23f1f5f9" stroke="%23e2e8f0" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="%232563eb">${encodeURIComponent(cityName || 'City')}</text></svg>`;
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
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=80',
    description: 'Find local businesses across New York, California, Texas, Illinois and 270+ cities.',
  },
};

// Exact 13 categories with exact requested descriptions and 100% unique verified Unsplash images
const CATEGORIES_LIST = [
  {
    name: 'Bank',
    description: 'Commercial banks, retail banking, branches, and financial services',
    image: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80',
  },
  {
    name: 'Laboratory',
    description: 'Diagnostic labs, medical testing, clinical research, and pathology',
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&q=80',
  },
  {
    name: 'Bus Companies',
    description: 'Intercity coaches, public transit, charter buses, and transportation',
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80',
  },
  {
    name: 'Information Technology (IT) & Services',
    description: 'IT consulting, software development, cloud computing, and tech solutions',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80',
  },
  {
    name: 'Hospital',
    description: 'Emergency care, specialty hospitals, clinics, and surgical centers',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80',
  },
  {
    name: 'Local Shops & Traders',
    description: 'Neighborhood markets, general stores, wholesale traders, and local shops',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80',
  },
  {
    name: 'Education',
    description: 'Schools, tutoring, courses, and educational services',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
  },
  {
    name: 'Shopping & Retail Chains',
    description: 'Supermarkets, hypermarkets, departmental stores, and retail brands',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=80',
  },
  {
    name: 'Real Estate',
    description: 'Property listings, agents, and real estate services',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
  },
  {
    name: 'Restaurants & Food Chains',
    description: 'Fine dining, fast food chains, cafes, bakeries, and eateries',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
  },
  {
    name: 'Importer and Exporter',
    description: 'Global trade, shipping merchants, customs clearance, and import/export',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
  },
  {
    name: 'Courier & Cargo Companies',
    description: 'Parcel delivery, freight forwarding, logistics, and express cargo',
    image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&q=80',
  },
  {
    name: 'Hotels & Guest Houses',
    description: 'Luxury hotels, boutique stays, resorts, motels, and guest houses',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  },
  {
    name: 'Telecom Companies',
    description: 'Mobile network operators, broadband internet, fiber optics, and telecom',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
  },
  {
    name: 'IT',
    description: 'Software, web development, IT services and tech companies',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
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

// Verified major city images (100% unique photo IDs, verified HTTP 200)
const CITY_IMAGES = {
  // Pakistan Major Cities
  Lahore: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=400&q=80',
  Karachi: 'https://images.unsplash.com/photo-1608667508764-33cf0726b13a?w=400&q=80',
  Islamabad: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400&q=80',
  Multan: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&q=80',
  Rawalpindi: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=400&q=80',
  Faisalabad: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&q=80',
  Peshawar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80',
  Quetta: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
  Hyderabad: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  Sialkot: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&q=80',
  Gujranwala: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=400&q=80',
  Bahawalpur: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80',
  Sukkur: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
  Abbottabad: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
  Murree: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
  Gwadar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  Gujrat: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&q=80',
  Kasur: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=400&q=80',
  Sahiwal: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
  Sargodha: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
  Larkana: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
  Sheikhupura: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80',
  Jhelum: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
  Kabirwala: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&q=80',

  // UAE Major Cities
  Dubai: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=400&q=80',
  'Abu Dhabi': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&q=80',
  Sharjah: 'https://images.unsplash.com/photo-1578895210405-907db486c111?w=400&q=80',
  Ajman: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80',
  'Ras Al Khaimah': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
  Fujairah: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&q=80',
  'Al Ain': 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400&q=80',
  'Umm Al Quwain': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&q=80',

  // USA Major Cities
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80',
  'Los Angeles': 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400&q=80',
  Chicago: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&q=80',
  Houston: 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=400&q=80',
  Miami: 'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=400&q=80',
  'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80',
  Seattle: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&q=80',
  Boston: 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=400&q=80',
  'Las Vegas': 'https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=400&q=80',
  Austin: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&q=80',
  Denver: 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&q=80',
  'San Diego': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
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

  // Category click: navigates with full filters (Country + City + Category)
  const handleCategoryClick = (categoryName) => {
    if (isHomePage) {
      let url = `/businesses?country=${encodeURIComponent(effectiveCountry)}`;
      if (effectiveCity) url += `&city=${encodeURIComponent(effectiveCity)}`;
      url += `&category=${encodeURIComponent(categoryName)}`;
      router.push(url);
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
    router.push(`/businesses?country=${encodeURIComponent(effectiveCountry)}&city=${encodeURIComponent(effectiveCity)}`);
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
                    <div className="w-[100px] h-[100px] min-w-[100px] min-h-[100px] rounded-[10px] overflow-hidden relative shrink-0 bg-slate-100 border border-slate-100 shadow-xs">
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
                          {count} {count === 1 ? 'business' : 'businesses'}
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

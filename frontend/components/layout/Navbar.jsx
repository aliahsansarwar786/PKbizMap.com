'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  ChevronDown,
  PlusCircle,
  Home,
  BookOpen,
  LayoutGrid,
  Info,
  Mail,
  Newspaper,
  Globe,
  Check,
  ArrowRight,
} from 'lucide-react';

// ── Lightweight, Self-Contained SVG Flag Badges (No external APIs, crisp on Windows) ──
function PakistanFlagCircle({ size = 20, className = '' }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden shrink-0 border border-black/15 shadow-2xs inline-flex items-center justify-center bg-[#01411c] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 900 600" className="w-full h-full object-cover">
        <rect width="900" height="600" fill="#01411c" />
        <rect width="225" height="600" fill="#ffffff" />
        <circle cx="562.5" cy="300" r="180" fill="#ffffff" />
        <circle cx="615" cy="265" r="165" fill="#01411c" />
        <polygon points="630,220 645,260 685,260 655,285 665,325 630,300 595,325 605,285 575,260 615,260" fill="#ffffff" />
      </svg>
    </span>
  );
}

function UAEFlagCircle({ size = 20, className = '' }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden shrink-0 border border-black/15 shadow-2xs inline-flex items-center justify-center bg-white ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 600" className="w-full h-full object-cover">
        <rect width="1200" height="200" y="0" fill="#00732f" />
        <rect width="1200" height="200" y="200" fill="#ffffff" />
        <rect width="1200" height="200" y="400" fill="#000000" />
        <rect width="300" height="600" x="0" fill="#ff0000" />
      </svg>
    </span>
  );
}

function USAFlagCircle({ size = 20, className = '' }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden shrink-0 border border-black/15 shadow-2xs inline-flex items-center justify-center bg-[#b22234] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 7410 3900" className="w-full h-full object-cover">
        <rect width="7410" height="3900" fill="#b22234" />
        <path d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410" stroke="#fff" strokeWidth="300" />
        <rect width="2964" height="2100" fill="#3c3b6e" />
        <circle cx="600" cy="500" r="120" fill="#ffffff" />
        <circle cx="1200" cy="500" r="120" fill="#ffffff" />
        <circle cx="1800" cy="500" r="120" fill="#ffffff" />
        <circle cx="2400" cy="500" r="120" fill="#ffffff" />
        <circle cx="900" cy="1050" r="120" fill="#ffffff" />
        <circle cx="1500" cy="1050" r="120" fill="#ffffff" />
        <circle cx="2100" cy="1050" r="120" fill="#ffffff" />
        <circle cx="600" cy="1600" r="120" fill="#ffffff" />
        <circle cx="1200" cy="1600" r="120" fill="#ffffff" />
        <circle cx="1800" cy="1600" r="120" fill="#ffffff" />
        <circle cx="2400" cy="1600" r="120" fill="#ffffff" />
      </svg>
    </span>
  );
}

const COUNTRIES_DIRECTORIES = [
  {
    code: 'PK',
    name: 'Pakistan',
    label: 'Pakistan',
    sublabel: 'Lahore, Karachi, Islamabad & 168+ cities',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Flag: PakistanFlagCircle,
  },
  {
    code: 'AE',
    name: 'UAE',
    label: 'UAE',
    sublabel: 'Dubai, Abu Dhabi, Sharjah & all Emirates',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200',
    Flag: UAEFlagCircle,
  },
  {
    code: 'US',
    name: 'USA',
    label: 'United States',
    sublabel: 'New York, California, Texas & 270+ cities',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    Flag: USAFlagCircle,
  },
];

const ALL_CATEGORIES = [
  'Bank',
  'Laboratory',
  'Bus Companies',
  'Information Technology (IT) & Services',
  'Hospital',
  'Local Shops & Traders',
  'Education',
  'Shopping & Retail Chains',
  'Real Estate',
  'Restaurants & Food Chains',
  'Importer and Exporter',
  'Courier & Cargo Companies',
  'Hotels & Guest Houses',
  'Telecom Companies',
];

// Inner component wrapped in Suspense to safely read searchParams in Next.js
function UrlParamsListener({ onParamsChange }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const c = searchParams?.get('country') || '';
    const cat = searchParams?.get('category') || '';
    onParamsChange(c, cat);
  }, [searchParams, onParamsChange]);
  return null;
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [directoriesOpen, setDirectoriesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Mobile accordion states
  const [mobileDirectoriesOpen, setMobileDirectoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  // Active query parameters
  const [currentCountry, setCurrentCountry] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  const handleParamsChange = useCallback((c, cat) => {
    setCurrentCountry(c);
    setCurrentCategory(cat);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setMobileOpen(false);
    setDirectoriesOpen(false);
    setCategoriesOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDirectoriesOpen(false);
        setCategoriesOpen(false);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileOpen(false);
      toast.success('Logged out successfully.');
      router.push('/');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  };

  const toggleDirectories = () => {
    setDirectoriesOpen((prev) => !prev);
    setCategoriesOpen(false);
    setUserMenuOpen(false);
  };

  const toggleCategories = () => {
    setCategoriesOpen((prev) => !prev);
    setDirectoriesOpen(false);
    setUserMenuOpen(false);
  };

  // Find active country details
  const activeCountryObj = COUNTRIES_DIRECTORIES.find(
    (c) => c.name.toLowerCase() === (currentCountry || '').toLowerCase()
  );
  const ActiveCountryFlag = activeCountryObj ? activeCountryObj.Flag : null;

  // Nav active states
  const isDirectoriesActive = pathname.startsWith('/businesses') && Boolean(currentCountry);
  const isCategoriesActive = pathname === '/categories' || (pathname.startsWith('/businesses') && Boolean(currentCategory));

  const avatarUrl = user?.avatar?.url
    ? user.avatar.url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=64`;

  return (
    <header
      style={{
        borderTop: '4px solid #2563eb',
        borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
        background: 'rgba(255, 255, 255, 0.98)',
      }}
      className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300 shadow-sm"
    >
      {/* Suspense listener for reactive search params */}
      <Suspense fallback={null}>
        <UrlParamsListener onParamsChange={handleParamsChange} />
      </Suspense>

      <nav className="container-max" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group ml-1">
            <div
              className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden"
              style={{ mixBlendMode: 'multiply' }}
            >
              <Image
                src="/logo-transparent.png"
                alt="BizPrimeHub Logo"
                width={56}
                height={56}
                className="object-cover w-full h-full drop-shadow-sm scale-110"
                priority
                unoptimized={true}
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[1.15rem] leading-tight text-slate-800 font-bold tracking-tight">
                BizPrime<span className="text-blue-600">Hub</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal leading-tight">
                Connecting Businesses, Building Success
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (visible on lg and up) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2" suppressHydrationWarning>
            {/* Home */}
            <Link
              href="/"
              style={{
                color: pathname === '/' ? '#ffffff' : '#4b5563',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                pathname === '/'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <Home size={15} strokeWidth={pathname === '/' ? 2.5 : 2} className="shrink-0" />
              <span>Home</span>
            </Link>

            {/* ── 1. Directories Dropdown with Flags ── */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleDirectories}
                aria-expanded={directoriesOpen}
                aria-haspopup="true"
                style={{
                  color: directoriesOpen || isDirectoriesActive ? '#ffffff' : '#4b5563',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  directoriesOpen || isDirectoriesActive
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                    : 'hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                {ActiveCountryFlag ? (
                  <ActiveCountryFlag size={18} />
                ) : (
                  <Globe
                    size={15}
                    strokeWidth={directoriesOpen || isDirectoriesActive ? 2.5 : 2}
                    className="shrink-0"
                  />
                )}
                <span>Directories</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform duration-200 ${
                    directoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {directoriesOpen && (
                <div
                  className="absolute left-0 mt-2 w-80 rounded-2xl shadow-xl py-2 z-50 bg-white border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150"
                  role="menu"
                  style={{
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="px-3.5 pt-1.5 pb-2 flex items-center justify-between border-b border-gray-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      CHOOSE DIRECTORY
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      3 Countries
                    </span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {COUNTRIES_DIRECTORIES.map((item) => {
                      const isItemActive =
                        currentCountry.toLowerCase() === item.name.toLowerCase();
                      const FlagComp = item.Flag;
                      return (
                        <Link
                          key={item.code}
                          href={`/businesses?country=${encodeURIComponent(item.name)}`}
                          onClick={() => setDirectoriesOpen(false)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                            isItemActive
                              ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                        >
                          <FlagComp size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900 leading-tight truncate">
                                {item.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${item.badgeClass}`}
                              >
                                {item.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">
                              {item.sublabel}
                            </p>
                          </div>
                          {isItemActive && (
                            <Check size={16} className="text-blue-600 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-gray-100 px-1.5">
                    <Link
                      href="/businesses"
                      onClick={() => setDirectoriesOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen size={14} className="text-gray-400" />
                        <span>All Listings Directory</span>
                      </span>
                      <ArrowRight size={13} className="text-gray-400" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. Categories Dropdown (All 13 Categories) ── */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleCategories}
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                style={{
                  color: categoriesOpen || isCategoriesActive ? '#ffffff' : '#4b5563',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  categoriesOpen || isCategoriesActive
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                    : 'hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <LayoutGrid
                  size={15}
                  strokeWidth={categoriesOpen || isCategoriesActive ? 2.5 : 2}
                  className="shrink-0"
                />
                <span>Categories</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform duration-200 ${
                    categoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div
                  className="absolute left-0 mt-2 w-[520px] rounded-2xl shadow-xl p-3 z-50 bg-white border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150"
                  role="menu"
                  style={{
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="px-2 pt-1 pb-2 flex items-center justify-between border-b border-gray-100 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      ALL 13 BUSINESS CATEGORIES
                    </span>
                    {currentCountry && (
                      <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                        <span>Filter in</span>
                        <span className="text-blue-600 font-bold">{currentCountry}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1 max-h-[380px] overflow-y-auto pr-1">
                    {ALL_CATEGORIES.map((cat) => {
                      const isItemActive =
                        currentCategory.toLowerCase() === cat.toLowerCase();
                      const targetUrl = currentCountry
                        ? `/businesses?country=${encodeURIComponent(currentCountry)}&category=${encodeURIComponent(cat)}`
                        : `/businesses?category=${encodeURIComponent(cat)}`;

                      return (
                        <Link
                          key={cat}
                          href={targetUrl}
                          onClick={() => setCategoriesOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isItemActive
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isItemActive && (
                            <Check size={14} className="text-blue-600 shrink-0 ml-1" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between px-2">
                    <Link
                      href="/categories"
                      onClick={() => setCategoriesOpen(false)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Explore Categories Overview Page</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Blog */}
            <Link
              href="/blog"
              style={{
                color: pathname.startsWith('/blog') ? '#ffffff' : '#4b5563',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                pathname.startsWith('/blog')
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <Newspaper
                size={15}
                strokeWidth={pathname.startsWith('/blog') ? 2.5 : 2}
                className="shrink-0"
              />
              <span>Blog</span>
            </Link>

            {/* About Us */}
            <Link
              href="/about"
              style={{
                color: pathname === '/about' ? '#ffffff' : '#4b5563',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                pathname === '/about'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <Info size={15} strokeWidth={pathname === '/about' ? 2.5 : 2} className="shrink-0" />
              <span>About Us</span>
            </Link>

            {/* Contact */}
            <Link
              href="/contact"
              style={{
                color: pathname === '/contact' ? '#ffffff' : '#4b5563',
                fontSize: '0.84rem',
                fontWeight: 600,
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                pathname === '/contact'
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-xs'
                  : 'hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <Mail size={15} strokeWidth={pathname === '/contact' ? 2.5 : 2} className="shrink-0" />
              <span>Contact</span>
            </Link>
          </div>

          {/* Desktop right side (Auth / User Menu) */}
          <div className="hidden lg:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  href="/add-business"
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  <PlusCircle size={15} />
                  Add Business
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setDirectoriesOpen(false);
                      setCategoriesOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    id="user-menu-button"
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden"
                      style={{ border: '2px solid #e5e7eb' }}
                    >
                      <Image
                        src={avatarUrl}
                        alt={user?.name || 'User'}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        color: '#1f2937',
                        maxWidth: 100,
                      }}
                      className="truncate"
                    >
                      {user?.name}
                    </span>
                    <ChevronDown size={14} color="#6b7280" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-52 rounded-xl shadow-lg py-1 z-50 bg-white border border-gray-200"
                      style={{ top: '100%' }}
                      role="menu"
                    >
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937' }}>
                          {user?.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        style={{ fontSize: '0.875rem', color: '#4b5563' }}
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                        style={{ fontSize: '0.875rem', color: '#4b5563' }}
                      >
                        <User size={15} /> Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/folder/new/admin"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                          style={{ fontSize: '0.875rem', color: '#2563eb' }}
                        >
                          <Shield size={15} /> Admin Panel
                        </Link>
                      )}
                      <div
                        style={{
                          borderTop: '1px solid #f3f4f6',
                          marginTop: '0.25rem',
                          paddingTop: '0.25rem',
                        }}
                      >
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
                          style={{ fontSize: '0.875rem', color: '#dc2626' }}
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle (visible below lg) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-slate-700 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div
            className="lg:hidden pb-4 pt-1 bg-white"
            style={{ borderTop: '1px solid #f3f4f6' }}
          >
            <div className="pt-3 space-y-1">
              {/* Home */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                style={{ fontSize: '0.875rem' }}
              >
                <Home size={16} />
                <span>Home</span>
              </Link>

              {/* ── 3. Mobile Directories Accordion ── */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileDirectoriesOpen(!mobileDirectoriesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-[0.875rem] font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={16} className="text-blue-600" />
                    <span>Directories</span>
                    {ActiveCountryFlag && <ActiveCountryFlag size={16} />}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      mobileDirectoriesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileDirectoriesOpen && (
                  <div className="pl-6 pr-3 py-1.5 space-y-1 bg-gray-50/70 rounded-xl my-1 border border-gray-100">
                    {COUNTRIES_DIRECTORIES.map((item) => {
                      const isItemActive =
                        currentCountry.toLowerCase() === item.name.toLowerCase();
                      const FlagComp = item.Flag;
                      return (
                        <Link
                          key={item.code}
                          href={`/businesses?country=${encodeURIComponent(item.name)}`}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                            isItemActive
                              ? 'bg-blue-100/70 text-blue-700 font-bold'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FlagComp size={20} />
                            <span>{item.label}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${item.badgeClass}`}
                            >
                              {item.code}
                            </span>
                          </div>
                          {isItemActive && <Check size={14} className="text-blue-600" />}
                        </Link>
                      );
                    })}
                    <Link
                      href="/businesses"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600"
                    >
                      <BookOpen size={13} />
                      <span>All Listings Directory</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* ── 4. Mobile Categories Accordion ── */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 text-[0.875rem] font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid size={16} className="text-blue-600" />
                    <span>Categories</span>
                    {currentCategory && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {currentCategory}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${
                      mobileCategoriesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileCategoriesOpen && (
                  <div className="pl-6 pr-3 py-1.5 space-y-1 bg-gray-50/70 rounded-xl my-1 border border-gray-100 max-h-64 overflow-y-auto">
                    {ALL_CATEGORIES.map((cat) => {
                      const isItemActive =
                        currentCategory.toLowerCase() === cat.toLowerCase();
                      const targetUrl = currentCountry
                        ? `/businesses?country=${encodeURIComponent(currentCountry)}&category=${encodeURIComponent(cat)}`
                        : `/businesses?category=${encodeURIComponent(cat)}`;

                      return (
                        <Link
                          key={cat}
                          href={targetUrl}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                            isItemActive
                              ? 'bg-blue-100/70 text-blue-700 font-bold'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isItemActive && (
                            <Check size={14} className="text-blue-600 shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                    <Link
                      href="/categories"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-xs font-bold text-blue-600 hover:underline pt-2 border-t border-gray-200/60"
                    >
                      <span>Explore Categories Page →</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Blog */}
              <Link
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname.startsWith('/blog')
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                style={{ fontSize: '0.875rem' }}
              >
                <Newspaper size={16} />
                <span>Blog</span>
              </Link>

              {/* About Us */}
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/about'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                style={{ fontSize: '0.875rem' }}
              >
                <Info size={16} />
                <span>About Us</span>
              </Link>

              {/* Contact */}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/contact'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                style={{ fontSize: '0.875rem' }}
              >
                <Mail size={16} />
                <span>Contact</span>
              </Link>

              {/* Auth Buttons / Profile on Mobile */}
              {isAuthenticated ? (
                <>
                  <div
                    style={{
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '0.75rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden"
                        style={{ border: '2px solid #e5e7eb' }}
                      >
                        <Image
                          src={avatarUrl}
                          alt={user?.name || 'User'}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937' }}>
                          {user?.name}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.role}</p>
                      </div>
                    </div>
                    <Link
                      href="/add-business"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      style={{ color: '#2563eb', fontSize: '0.875rem' }}
                    >
                      <PlusCircle size={15} /> Add Business
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      style={{ color: '#4b5563', fontSize: '0.875rem' }}
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/folder/new/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                        style={{ color: '#2563eb', fontSize: '0.875rem' }}
                      >
                        <Shield size={15} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 w-full text-left cursor-pointer"
                      style={{ color: '#dc2626', fontSize: '0.875rem' }}
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    borderTop: '1px solid #f3f4f6',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                  }}
                  className="flex flex-col gap-2 px-3"
                >
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary w-full justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full justify-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop overlay for closing dropdowns when clicking outside */}
      {(directoriesOpen || categoriesOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setDirectoriesOpen(false);
            setCategoriesOpen(false);
            setUserMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

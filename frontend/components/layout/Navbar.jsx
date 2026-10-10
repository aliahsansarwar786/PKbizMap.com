'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
  Mail
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

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

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/businesses', label: 'Directory', icon: BookOpen },
    { href: '/categories', label: 'Categories', icon: LayoutGrid },
    { href: '/about', label: 'About Us', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
  ];

  const avatarUrl = user?.avatar?.url
    ? user.avatar.url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=64`;

  return (
    <header style={{ borderTop: '4px solid #2563eb', borderBottom: '1px solid rgba(229, 231, 235, 0.5)', background: 'rgba(255, 255, 255, 0.98)' }} className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300 shadow-sm">
      <nav className="container-max" aria-label="Main navigation">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg group"
          >
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
            >
              <Image src="/logo-transparent.svg" alt="BizPrimeHub Logo" width={48} height={48} className="object-contain w-full h-full drop-shadow-sm" priority unoptimized={true} />
            </div>
            <div className="flex flex-col">
              <span className="text-[1.15rem] leading-tight text-slate-800 tracking-tight">BizPrime<span className="text-blue-600">Hub</span></span>
              <span className="text-[10px] text-slate-500 font-normal">Connecting Businesses, Building Success</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4" suppressHydrationWarning>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isHome = link.href === '/';
              return (
              <Link
                key={link.href}
                href={link.href}
                style={{ color: isHome ? '#ffffff' : '#4b5563', fontSize: '0.875rem', fontWeight: 600 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isHome ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' : 'hover:bg-gray-100 hover:text-blue-600'}`}
              >
                <Icon size={16} strokeWidth={isHome ? 2.5 : 2} />
                <span>{link.label}</span>
              </Link>
            )})}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/add-business" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  <PlusCircle size={15} />
                  Add Business
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    id="user-menu-button"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '2px solid #e5e7eb' }}>
                      <Image src={avatarUrl} alt={user?.name || 'User'} width={32} height={32} className="object-cover" />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1f2937', maxWidth: 100 }} className="truncate">
                      {user?.name}
                    </span>
                    <ChevronDown size={14} color="#6b7280" />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-52 rounded-xl shadow-lg py-1 z-50"
                      style={{ background: '#ffffff', border: '1px solid #e5e7eb', top: '100%' }}
                      role="menu"
                    >
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937' }}>{user?.name}</p>
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
                      <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-50 transition-colors"
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
                <Link href="/login" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-4"
            style={{ borderTop: '1px solid #f3f4f6' }}
          >
            <div className="pt-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ fontSize: '0.875rem', color: '#4b5563' }}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '2px solid #e5e7eb' }}>
                        <Image src={avatarUrl} alt={user?.name || 'User'} width={32} height={32} className="object-cover" />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user?.role}</p>
                      </div>
                    </div>
                    <Link href="/add-business" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#2563eb', fontSize: '0.875rem' }}>
                      <PlusCircle size={15} /> Add Business
                    </Link>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link href="/folder/new/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ color: '#2563eb', fontSize: '0.875rem' }}>
                        <Shield size={15} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 w-full" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem' }} className="flex flex-col gap-2 px-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for user dropdown */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

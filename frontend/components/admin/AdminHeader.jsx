// @ts-check
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Download,
  Calendar,
  User,
  LogOut,
  X,
  Loader2,
  Shield,
} from 'lucide-react';
import { adminAPI } from '@/lib/api';

export default function AdminHeader({
  onOpenDrawer,
  dashStats,
  onSelectPendingTab,
  user,
  onLogout,
  onDownloadBackup,
  isExportingBackup,
  onSearchUserSelect,
  isSuperAdmin = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const avatarMenuRef = useRef(null);

  const pendingCount = dashStats?.pendingBusinesses ?? 0;

  // Format current date: e.g. "Oct 28, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Handle outside clicks to close menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Live user search via existing adminAPI.getUsers({ search })
  const executeSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setIsSearching(true);
    setSearchOpen(true);
    try {
      const res = await adminAPI.getUsers({ search: trimmed, limit: 5 });
      setSearchResults(res.data?.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleSelectUser = (u) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (onSearchUserSelect) {
      onSearchUserSelect(u);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 shrink-0 z-30">
      {/* Top Header Row */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu Trigger + Mobile Logo + Desktop Global Search */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger (Mobile & Tablet) */}
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Menu size={22} />
          </button>

          {/* Mobile title */}
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-bold text-gray-900 text-base tracking-tight">BizPrimeHub</span>
          </div>

          {/* Desktop Search Bar */}
          <div ref={searchContainerRef} className="hidden md:block relative w-full max-w-sm lg:max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                {isSearching ? (
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                ) : (
                  <Search size={16} />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    executeSearch(e.target.value);
                  } else {
                    setSearchResults([]);
                    setSearchOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                    setSearchOpen(true);
                  }
                }}
                placeholder="Search businesses, users, or anything..."
                className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Desktop Search Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Users Search Results
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'}
                  </span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full text-left p-3 hover:bg-blue-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : u.role === 'sub-admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">
                    {isSearching ? 'Searching...' : 'No users matching your search.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Backup Button + Date Badge + Bell + Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Download Backup Button (Super Admin only, desktop & tablet) */}
          {isSuperAdmin && onDownloadBackup && (
            <button
              type="button"
              onClick={onDownloadBackup}
              disabled={isExportingBackup}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 cursor-pointer transition-all shadow-2xs min-h-[40px]"
              title="Download full JSON backup"
            >
              <Download size={15} className={isExportingBackup ? 'animate-bounce text-blue-600' : 'text-gray-500'} />
              <span>{isExportingBackup ? 'Preparing backup…' : 'Download Backup'}</span>
            </button>
          )}

          {/* Current Date Badge (Desktop & Tablet) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200/70 rounded-xl text-xs font-medium text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>{formattedDate}</span>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onSelectPendingTab}
            aria-label="Pending items notifications"
            className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
            title={pendingCount > 0 ? `${pendingCount} pending items waiting for review` : 'No pending items'}
          >
            <Bell size={20} />
            {/* Red indicator dot shown ONLY when pending count > 0 */}
            {pendingCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Admin Avatar Block & Dropdown */}
          <div ref={avatarMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-2 sm:py-1.5 rounded-xl hover:bg-gray-100 cursor-pointer min-h-[44px] transition-colors"
              aria-label="User account menu"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                <User size={18} />
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 'Sub-Admin'}
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </button>

            {/* Avatar Dropdown Menu */}
            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in-50 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                  {user?.email && (
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  )}
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      <Shield size={10} />
                      {user?.role === 'admin' ? 'Super Administrator' : 'Sub-Admin'}
                    </span>
                  </div>
                </div>

                {isSuperAdmin && onDownloadBackup && (
                  <div className="sm:hidden px-1.5 py-1 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        onDownloadBackup();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <Download size={14} className="text-gray-500" />
                      <span>{isExportingBackup ? 'Preparing backup…' : 'Download Backup'}</span>
                    </button>
                  </div>
                )}

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Bar: Full-Width Search Input (< 768px) */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-gray-100">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            ) : (
              <Search size={16} />
            )}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                executeSearch(e.target.value);
              } else {
                setSearchResults([]);
                setSearchOpen(false);
              }
            }}
            placeholder="Search businesses, users, or anything..."
            className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Clear mobile search"
            >
              <X size={15} />
            </button>
          )}
        </form>

        {/* Mobile Search Results Dropdown */}
        {searchOpen && (
          <div className="mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Search Results
              </span>
              <span className="text-[10px] text-gray-400">{searchResults.length} found</span>
            </div>
            {searchResults.length > 0 ? (
              <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left p-2.5 hover:bg-blue-50/50 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-gray-500">
                {isSearching ? 'Searching...' : 'No users matching search.'}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

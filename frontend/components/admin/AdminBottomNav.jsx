'use client';

import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  MoreHorizontal,
  Star,
  Users,
  Mail,
  Activity,
  QrCode,
  BarChart3,
  Settings,
  ExternalLink,
  Download,
  LogOut,
  X,
  FileCheck,
} from 'lucide-react';

export default function AdminBottomNav({
  activeSection = 'dashboard',
  activeTab = 'pending',
  onSelectTab,
  onSelectSection,
  isMoreOpen = false,
  setIsMoreOpen,
  tabs = [],
  dashStats,
  onLogout,
  onDownloadBackup,
  isExportingBackup,
  isSuperAdmin = true,
}) {
  // Close More sheet on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen, setIsMoreOpen]);

  const handleNavClick = (section, tabId) => {
    if (onSelectSection) {
      onSelectSection(section, tabId);
    }
  };

  const handleMoreItemClick = (section, tabId, action) => {
    setIsMoreOpen(false);
    if (action) {
      action();
    } else if (onSelectSection) {
      onSelectSection(section, tabId);
    }
  };

  const isDashboardActive = activeSection === 'dashboard' && !['all-businesses', 'payments'].includes(activeTab);
  const isBusinessesActive = activeSection === 'dashboard' && activeTab === 'all-businesses';
  const isPaymentsActive = activeSection === 'dashboard' && activeTab === 'payments';
  const isMoreActive = isMoreOpen || (!isDashboardActive && !isBusinessesActive && !isPaymentsActive);

  return (
    <>
      {/* Fixed Bottom Bar on Mobile/Tablet (< 1024px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 lg:hidden flex items-center justify-around px-2 shadow-lg select-none"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard', 'pending')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
            isDashboardActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <LayoutDashboard size={20} className={isDashboardActive ? 'stroke-[2.2]' : ''} />
          <span className="text-[10px] mt-1">Dashboard</span>
        </button>

        {/* 2. Businesses */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard', 'all-businesses')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
            isBusinessesActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 size={20} className={isBusinessesActive ? 'stroke-[2.2]' : ''} />
          <span className="text-[10px] mt-1">Businesses</span>
        </button>

        {/* 3. Payments */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard', 'payments')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
            isPaymentsActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard size={20} className={isPaymentsActive ? 'stroke-[2.2]' : ''} />
          <span className="text-[10px] mt-1">Payments</span>
        </button>

        {/* 4. More */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
            isMoreActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <MoreHorizontal size={20} className={isMoreActive ? 'stroke-[2.2]' : ''} />
          <span className="text-[10px] mt-1">More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation options"
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 z-50 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-base">More Navigation</h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close more menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dashboard Tabs Grid */}
            <div className="py-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Directory Tabs
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Reviews */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'reviews')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-pink-500" />
                    <span className="text-xs font-medium text-gray-800">Reviews</span>
                  </div>
                  {dashStats?.totalReviews != null && (
                    <span className="text-[10px] font-semibold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                      {dashStats.totalReviews}
                    </span>
                  )}
                </button>

                {/* Claim Requests */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'claims')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck size={16} className="text-blue-500" />
                    <span className="text-xs font-medium text-gray-800">Claims</span>
                  </div>
                </button>

                {/* Users */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'users')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-xs font-medium text-gray-800">Users</span>
                  </div>
                  {dashStats?.totalUsers != null && (
                    <span className="text-[10px] font-semibold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                      {dashStats.totalUsers}
                    </span>
                  )}
                </button>

                {/* Emails */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'emails')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-indigo-500" />
                    <span className="text-xs font-medium text-gray-800">Emails</span>
                  </div>
                </button>

                {/* Activity */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'activity')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" />
                    <span className="text-xs font-medium text-gray-800">Activity</span>
                  </div>
                </button>

                {/* Raast QR Settings */}
                <button
                  type="button"
                  onClick={() => handleMoreItemClick('dashboard', 'payment-settings')}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-blue-50 text-left min-h-[44px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-amber-500" />
                    <span className="text-xs font-medium text-gray-800">Raast QR</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Other Sections */}
            <div className="py-2 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Sections & Tools
              </p>
              <div className="space-y-1">
                {[
                  ...(isSuperAdmin ? [{ id: 'reports', label: 'Reports', icon: BarChart3 }] : []),
                  ...(isSuperAdmin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMoreItemClick(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 min-h-[44px] cursor-pointer"
                    >
                      <Icon size={16} className="text-gray-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (typeof window !== 'undefined') window.open('/', '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 min-h-[44px] cursor-pointer"
                >
                  <ExternalLink size={16} className="text-gray-500" />
                  <span>View Website</span>
                </button>
              </div>
            </div>

            {/* Actions: Download Backup + Logout */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {isSuperAdmin && onDownloadBackup && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onDownloadBackup();
                  }}
                  disabled={isExportingBackup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold min-h-[44px] cursor-pointer"
                >
                  <Download size={15} />
                  <span>{isExportingBackup ? 'Preparing backup…' : 'Download Backup'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold min-h-[44px] cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

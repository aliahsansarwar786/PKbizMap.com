'use client';

import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Clock,
  Building2,
  CreditCard,
  Star,
  ShieldCheck,
  Users,
  Mail,
  Activity,
  QrCode,
  BarChart3,
  Settings,
  ExternalLink,
  Store,
  X,
} from 'lucide-react';

export default function AdminSidebar({
  activeSection = 'dashboard',
  activeTab = 'pending',
  onSelectSection,
  isMobileDrawer = false,
  isOpen = false,
  onClose,
  dashStats,
  tabs = [],
}) {
  // Close drawer on Escape key
  useEffect(() => {
    if (!isMobileDrawer || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawer, isOpen, onClose]);

  const mainNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      section: 'dashboard',
      targetTab: null, // stays on active tab or defaults
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: Clock,
      section: 'dashboard',
      targetTab: 'pending',
    },
    {
      id: 'all-businesses',
      label: 'All Businesses',
      icon: Building2,
      section: 'dashboard',
      targetTab: 'all-businesses',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      section: 'payments',
    },
    {
      id: 'payment-history',
      label: 'Payment History',
      icon: CreditCard,
      section: 'dashboard',
      targetTab: 'payments',
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      section: 'dashboard',
      targetTab: 'reviews',
    },
    {
      id: 'claims',
      label: 'Claim Requests',
      icon: ShieldCheck,
      section: 'dashboard',
      targetTab: 'claims',
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      section: 'dashboard',
      targetTab: 'users',
    },
    {
      id: 'emails',
      label: 'Emails',
      icon: Mail,
      section: 'dashboard',
      targetTab: 'emails',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      section: 'dashboard',
      targetTab: 'activity',
    },
    {
      id: 'payment-settings',
      label: 'Raast QR Settings',
      icon: QrCode,
      section: 'dashboard',
      targetTab: 'payment-settings',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      section: 'reports',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      section: 'settings',
    },
  ];

  const adminToolItems = [
    {
      id: 'view-website',
      label: 'View Website',
      icon: ExternalLink,
      action: () => {
        if (typeof window !== 'undefined') {
          window.open('/', '_blank', 'noopener,noreferrer');
        }
      },
    },
  ];

  const handleNavClick = (item) => {
    if (item.action) {
      item.action();
    } else if (onSelectSection) {
      onSelectSection(item.section, item.targetTab);
    }
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  const isItemActive = (item) => {
    if (item.action) return false;
    if (item.section !== 'dashboard') {
      return activeSection === item.section;
    }
    // Dashboard section items
    if (item.targetTab) {
      return activeSection === 'dashboard' && activeTab === item.targetTab;
    }
    if (item.id === 'dashboard') {
      return activeSection === 'dashboard' && !activeTab;
    }
    return false;
  };

  const getBadgeForItem = (item) => {
    if (tabs && tabs.length > 0 && item.targetTab) {
      const matchedTab = tabs.find((t) => t.id === item.targetTab);
      if (matchedTab && matchedTab.badge != null) {
        return {
          text: matchedTab.badge,
          badgeClass: matchedTab.badgeClass,
        };
      }
    }
    if (item.targetTab === 'pending' && dashStats?.pendingBusinesses != null && dashStats.pendingBusinesses > 0) {
      return { text: dashStats.pendingBusinesses };
    }
    if (item.targetTab === 'reviews' && dashStats?.totalReviews != null && dashStats.totalReviews > 0) {
      return { text: dashStats.totalReviews };
    }
    return null;
  };

  const content = (
    <div className="flex flex-col h-full bg-white text-gray-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Store size={20} className="stroke-[2.2]" />
          </div>
          <div className="leading-tight">
            <h1 className="font-bold text-gray-900 text-base tracking-tight">BizPrimeHub</h1>
            <p className="text-[11px] font-medium text-gray-400">Business Directory</p>
          </div>
        </div>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          const badgeInfo = getBadgeForItem(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                active
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={`shrink-0 ${active ? 'text-blue-600 stroke-[2.2]' : 'text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
              {badgeInfo && badgeInfo.text != null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shrink-0 ${
                    active
                      ? 'bg-blue-200/70 text-blue-800'
                      : badgeInfo.badgeClass === 'badge-green'
                      ? 'bg-emerald-100 text-emerald-800'
                      : badgeInfo.badgeClass === 'badge-yellow'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {badgeInfo.text}
                </span>
              )}
            </button>
          );
        })}

        {/* Section: Admin Tools */}
        <div className="pt-5 pb-1.5 px-3">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Admin Tools
          </span>
        </div>

        {adminToolItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer min-h-[44px] ${
                active
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={`shrink-0 ${active ? 'text-blue-600 stroke-[2.2]' : 'text-gray-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer Card */}
      <div className="p-3.5 border-t border-gray-100 shrink-0">
        <div className="bg-blue-50/70 border border-blue-100/70 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Store size={16} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-bold text-xs text-gray-900 truncate">BizPrimeHub</p>
            <p className="text-[10px] text-gray-500 truncate">Grow Local. Grow Together.</p>
          </div>
        </div>
        <p className="text-[11px] font-medium text-blue-600 text-center pt-2.5">
          💙 Made by Ahsan Ali
        </p>
      </div>
    </div>
  );

  // If mobile drawer mode
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* Slide-over panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation drawer"
          className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col h-full animate-in slide-in-from-left duration-200"
        >
          {content}
        </aside>
      </div>
    );
  }

  // Desktop fixed sidebar
  return (
    <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-gray-200 h-full flex-col shrink-0">
      {content}
    </aside>
  );
}

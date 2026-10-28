'use client';

import React from 'react';
import {
  ArrowLeft,
  Settings,
  LayoutGrid,
  MapPin,
  BarChart3,
  FileText,
  CreditCard,
  Download,
  LogOut,
  Info,
} from 'lucide-react';

export default function AdminPlaceholderView({
  section = 'settings',
  onBackToDashboard,
  onDownloadBackup,
  isExportingBackup = false,
  onLogout,
  isSuperAdmin = true,
}) {
  const sectionMeta = {
    categories: {
      title: 'Categories',
      subtitle: 'Manage directory business categories and classifications',
      icon: LayoutGrid,
      color: '#2563eb',
    },
    locations: {
      title: 'Locations',
      subtitle: 'Manage operational cities, regions, and geographical coverage',
      icon: MapPin,
      color: '#059669',
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'System logs, engagement insights, and platform summaries',
      icon: BarChart3,
      color: '#7c3aed',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Configure platform parameters, backups, and security',
      icon: Settings,
      color: '#4b5563',
    },
    'manage-pages': {
      title: 'Manage Pages',
      subtitle: 'Static pages and directory content management',
      icon: FileText,
      color: '#0891b2',
    },
    'jazzcash-settings': {
      title: 'JazzCash Settings',
      subtitle: 'Payment gateway configuration and merchant details',
      icon: CreditCard,
      color: '#d97706',
    },
  };

  const current = sectionMeta[section] || {
    title: 'Directory Management',
    subtitle: 'Section details and configuration',
    icon: Settings,
    color: '#2563eb',
  };

  const Icon = current.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{current.title}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{current.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer min-h-[44px] px-3 py-2 flex items-center"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Special Settings View (Real actions: Backup + Logout; placeholder for the rest) */}
      {section === 'settings' ? (
        <div className="space-y-4">
          {/* Working Backup Action */}
          {isSuperAdmin && onDownloadBackup && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">Backup Database</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Download a full JSON archive of all directory data (businesses, users, reviews, and logs).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadBackup}
                  disabled={isExportingBackup}
                  className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  <Download size={16} />
                  <span>{isExportingBackup ? 'Preparing backup…' : 'Download Backup'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Working Logout Action */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Admin Account Session</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Securely sign out of your administrative session on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl min-h-[44px] cursor-pointer transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Unimplemented Settings Sub-Features Placeholder */}
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3">
              <Info size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Additional Settings</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              This section is not available yet.
            </p>
          </div>
        </div>
      ) : (
        /* General Placeholder Card */
        <div className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-14 text-center shadow-xs">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${current.color}15`, color: current.color }}
          >
            <Icon size={28} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{current.title}</h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-6">
            This section is not available yet.
          </p>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="btn-primary text-xs sm:text-sm px-5 py-2.5 rounded-xl cursor-pointer min-h-[44px] inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
}

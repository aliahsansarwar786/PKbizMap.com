'use client';

import React from 'react';
import { Database, Cloud, FileText } from 'lucide-react';

export default function AdminQuotaCards({ quota, loading = false }) {
  // Free-tier denominators (display-only limits specified in design)
  const BUSINESS_MAX = 2000;
  const MONGO_MAX_MB = 512;
  const CLOUDINARY_MAX_CREDITS = 25;

  const businessCount = quota?.businessCount != null ? quota.businessCount : null;
  const businessPercent = businessCount != null ? Math.min(100, Math.max(0, (businessCount / BUSINESS_MAX) * 100)) : null;

  const mongoMB = quota?.mongoDataMB != null ? quota.mongoDataMB : null;
  const mongoPercent = mongoMB != null ? Math.min(100, Math.max(0, (mongoMB / MONGO_MAX_MB) * 100)) : null;

  const cloudinaryCredits = quota?.cloudinaryCreditsUsed != null ? quota.cloudinaryCreditsUsed : null;
  const cloudinaryPercent = cloudinaryCredits != null ? Math.min(100, Math.max(0, (cloudinaryCredits / CLOUDINARY_MAX_CREDITS) * 100)) : null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs animate-pulse">
            <div className="h-4 bg-gray-200 rounded-sm w-3/4 mb-3" />
            <div className="h-2 bg-gray-100 rounded-full w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded-sm w-1/4 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Business Quota */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
              Business Quota (Free Tier)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {businessCount != null ? `${businessCount} / ${BUSINESS_MAX}` : '—'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${businessPercent ?? 0}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-gray-500 text-right">
          {businessPercent != null ? `${businessPercent.toFixed(1)}% Used` : '—'}
        </p>
      </div>

      {/* 2. MongoDB Storage */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Database size={17} />
            </div>
            <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
              MongoDB Storage (Free Tier)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {mongoMB != null ? `${mongoMB}MB / ${MONGO_MAX_MB}MB` : '—'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${mongoPercent ?? 0}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-gray-500 text-right">
          {mongoPercent != null ? `${mongoPercent.toFixed(1)}% Used` : '—'}
        </p>
      </div>

      {/* 3. Cloudinary Credits */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Cloud size={17} />
            </div>
            <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
              Cloudinary Credits (Free Tier)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
            {cloudinaryCredits != null ? `${cloudinaryCredits} / ${CLOUDINARY_MAX_CREDITS}` : '—'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-500"
            style={{ width: `${cloudinaryPercent ?? 0}%` }}
          />
        </div>
        <p className="text-[11px] font-medium text-gray-500 text-right">
          {cloudinaryPercent != null ? `${cloudinaryPercent.toFixed(1)}% Used` : '—'}
        </p>
      </div>
    </div>
  );
}

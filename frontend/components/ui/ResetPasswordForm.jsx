// @ts-check
'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function ResetPasswordForm() {
  return (
    <div className="card p-8 max-w-md mx-auto text-center shadow-lg border border-amber-200 bg-white">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Reset Method Updated
      </h1>
      <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full mb-4">
        Security Upgrade
      </div>
      <p className="text-gray-700 font-medium text-base mb-2">
        This reset method is no longer used — request a new code.
      </p>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        For your protection, BizPrimeHub now uses secure 6-digit verification codes delivered straight to your email inbox instead of reset links.
      </p>
      <div className="space-y-3">
        <Link
          href="/forgot-password"
          className="btn-primary w-full justify-center py-3 flex items-center gap-2 text-base font-semibold shadow-md"
        >
          <span>Request a New Code</span>
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/login"
          className="block text-sm text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
        >
          &larr; Return to Sign In
        </Link>
      </div>
    </div>
  );
}


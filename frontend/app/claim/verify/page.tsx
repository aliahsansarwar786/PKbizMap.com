'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { claimAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Building,
  KeyRound,
  ExternalLink,
  MapPin,
  Tag,
} from 'lucide-react';

function ClaimVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated, logout }: any = useAuth();

  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState<string>(tokenParam);
  const [code, setCode] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [completedBusiness, setCompletedBusiness] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Automatically attempt verification if token exists in URL
  const verifyWithToken = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    setLoading(true);
    setError('');
    try {
      const res = await claimAPI.verify({ token: tokenToVerify });
      setClaimData(res.data);
      toast.success('Claim token verified!');
    } catch (err: any) {
      setError(err?.message || 'Verification token is invalid or expired.');
      toast.error(err?.message || 'Verification token is invalid or expired.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      verifyWithToken(tokenParam);
    }
  }, [tokenParam, verifyWithToken]);

  // Handle manual 6-digit code verification
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await claimAPI.verify({
        code: code.trim(),
        email: email.trim() || undefined,
      });
      setClaimData(res.data);
      toast.success('Claim code verified successfully!');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code.');
      toast.error(err?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Complete claim when logged in with the matching verified email
  const handleCompleteClaim = async () => {
    if (!claimData) return;
    setLoading(true);
    setError('');
    try {
      const res = await claimAPI.complete({
        claimId: claimData.claimId,
        token: token || undefined,
        code: code || undefined,
      });
      setCompletedBusiness(res.data?.business || claimData.business);
      toast.success('Ownership transferred successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to complete ownership claim.');
      toast.error(err?.message || 'Failed to complete ownership claim.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailMatching = Boolean(
    isAuthenticated &&
    user?.email &&
    claimData?.chosenEmail &&
    user.email.toLowerCase() === claimData.chosenEmail.toLowerCase()
  );

  const isEmailMismatched = Boolean(
    isAuthenticated &&
    user?.email &&
    claimData?.chosenEmail &&
    user.email.toLowerCase() !== claimData.chosenEmail.toLowerCase()
  );

  // If already completed in this session:
  if (completedBusiness) {
    return (
      <div className="section container-max py-16">
        <div className="max-w-xl mx-auto card p-8 sm:p-10 text-center shadow-xl border-emerald-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            You now own this listing!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
            Ownership of <strong className="text-gray-900">{completedBusiness.title}</strong> has been successfully verified and attached to your account (<span className="text-blue-600 font-medium">{user?.email}</span>).
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 text-left mb-8 space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Building size={14} className="text-blue-600 shrink-0" />
              <span><strong>Business:</strong> {completedBusiness.title}</span>
            </div>
            {completedBusiness.category && (
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-blue-600 shrink-0" />
                <span><strong>Category:</strong> {completedBusiness.category}</span>
              </div>
            )}
            {completedBusiness.address?.city && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-600 shrink-0" />
                <span><strong>City:</strong> {completedBusiness.address.city}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary justify-center py-2.5">
              Go to Your Dashboard <ArrowRight size={16} />
            </Link>
            <Link
              href={`/businesses/${completedBusiness.slug || completedBusiness._id}`}
              className="btn-secondary justify-center py-2.5"
            >
              View Live Listing <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section container-max py-12">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Page Title Card */}
        <div className="card p-6 sm:p-8 text-center bg-gradient-to-b from-white to-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Claim Listing Verification
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Verify listing ownership with your 6-digit code or 1-click email link.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Step 1: Verification (if not yet verified) */}
        {!claimData && (
          <div className="card p-6 sm:p-8">
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="input-field pl-9 text-lg tracking-widest font-mono font-bold text-blue-900 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Verification Email <span className="text-gray-400 text-[10px] font-normal">(Optional if checking direct code)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="The email where you received the code"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 font-bold shadow-md shadow-blue-600/20"
              >
                {loading ? <span className="spinner" /> : <ShieldCheck size={16} />}
                {loading ? 'Verifying...' : 'Verify Claim Code'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Claim details & Auth verification (once code/token is verified) */}
        {claimData && (
          <div className="card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-gray-100 pb-4">
              <span className="badge badge-emerald text-xs mb-2">
                ✓ Ownership Code Verified
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {claimData.business?.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified for claimant: <strong className="text-gray-800">{claimData.claimantName}</strong>
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-blue-950">
                Verified Email Address:
              </p>
              <div className="inline-block px-3 py-1.5 bg-white border border-blue-200 text-blue-900 font-mono font-bold rounded-lg text-sm">
                {claimData.chosenEmail}
              </div>
              <p className="text-blue-800/80 text-xs leading-relaxed pt-1">
                To complete this ownership transfer, you must be logged into BizPrimeHub using this exact email address.
              </p>
            </div>

            {/* Path A: Visitor is NOT logged in */}
            {!isAuthenticated && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900">
                  Please log in or register with <strong>{claimData.chosenEmail}</strong> to finish claiming this listing.
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/claim/verify?token=${token || ''}`)}`}
                    className="btn-primary justify-center py-2.5"
                  >
                    <LogIn size={16} /> Log In with Email
                  </Link>
                  <Link
                    href={`/register?email=${encodeURIComponent(claimData.chosenEmail)}&redirect=${encodeURIComponent(`/claim/verify?token=${token || ''}`)}`}
                    className="btn-secondary justify-center py-2.5"
                  >
                    <UserPlus size={16} /> Create Account
                  </Link>
                </div>
              </div>
            )}

            {/* Path B: Logged in but email is mismatched */}
            {isEmailMismatched && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-900 leading-relaxed">
                  <p className="font-bold mb-1">Account Email Mismatch</p>
                  You are currently logged in as <strong>{user?.email}</strong>. This listing can only be claimed by an account registered with <strong>{claimData.chosenEmail}</strong>.
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (typeof logout === 'function') {
                      await logout();
                    }
                    router.push(`/login?redirect=${encodeURIComponent(`/claim/verify?token=${token || ''}`)}`);
                  }}
                  className="btn-secondary w-full justify-center text-xs py-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  Log Out to Switch Account
                </button>
              </div>
            )}

            {/* Path C: Logged in and email matches! Ready to complete */}
            {isEmailMatching && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900">
                  ✓ Logged in as <strong>{user?.email}</strong>. Ready to finalize ownership transfer!
                </div>

                <button
                  type="button"
                  onClick={handleCompleteClaim}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base font-bold shadow-lg shadow-blue-600/25"
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Finalizing Ownership...
                    </>
                  ) : (
                    <>Complete Claim &amp; Take Ownership</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="section container-max py-16 text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading verification...</p>
        </div>
      }
    >
      <ClaimVerifyContent />
    </Suspense>
  );
}

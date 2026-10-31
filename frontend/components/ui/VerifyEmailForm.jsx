'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Edit3, ArrowRight, Lock } from 'lucide-react';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuth();

  const isRegisteredJustNow = searchParams.get('registered') === 'true';
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(isRegisteredJustNow ? 60 : 0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [blockedUntilSeconds, setBlockedUntilSeconds] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changePassword, setChangePassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const inputRefs = useRef([]);
  const autoResendTriggered = useRef(false);

  // Initialize email from query param or auth state
  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail.trim());
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [searchParams, user]);

  // Handle auto-resend if routed with ?resend=true from login prompt
  useEffect(() => {
    const shouldResend = searchParams.get('resend') === 'true';
    const targetEmail = searchParams.get('email')?.trim() || email;
    if (shouldResend && targetEmail && !autoResendTriggered.current) {
      autoResendTriggered.current = true;
      setResending(true);
      authAPI
        .resendOtp({ email: targetEmail.toLowerCase() })
        .then(() => {
          toast.success('A fresh 6-digit code has been sent to your email!');
          setResendCooldown(60);
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        })
        .catch((err) => {
          if (err.isBlocked || err.status === 429) {
            const retry = err.retryAfter || 60;
            if (err.isBlocked) {
              setBlockedUntilSeconds(retry);
            } else {
              setResendCooldown(retry);
            }
            toast.error(err.message || 'Please wait before requesting a new code.');
          } else {
            toast.error(err.message || 'Failed to resend code.');
          }
        })
        .finally(() => {
          setResending(false);
        });
    }
  }, [searchParams, email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // IP Block countdown timer
  useEffect(() => {
    if (blockedUntilSeconds <= 0) return;
    const interval = setInterval(() => {
      setBlockedUntilSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntilSeconds]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // User typed or pasted multiple characters into a single slot
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) newOtp[i] = c;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto advance to next slot
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    const cleaned = pasteData.replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;

    const newOtp = [...otp];
    cleaned.split('').forEach((c, i) => {
      if (i < 6) newOtp[i] = c;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(cleaned.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const fullOtp = otp.join('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error('Email address is missing.');
      return;
    }
    if (fullOtp.length !== 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }
    if (blockedUntilSeconds > 0) {
      toast.error('Your IP is temporarily locked. Please wait before retrying.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ email: email.toLowerCase(), otp: fullOtp });
      toast.success('Email verified successfully!');
      setVerifiedSuccess(true);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setTimeout(() => {
        const rawNext = searchParams.get('next');
        const isValidNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//');
        const nextUrl = isValidNext ? rawNext : '/dashboard';
        router.push(nextUrl);
      }, 1500);
    } catch (err) {
      if (err.isBlocked || err.status === 429) {
        const retry = err.retryAfter || 1800;
        setBlockedUntilSeconds(retry);
        toast.error(`Too many failed attempts. Blocked for ${Math.ceil(retry / 60)} minutes.`);
      } else {
        if (err.attemptsRemaining !== undefined) {
          setAttemptsRemaining(err.attemptsRemaining);
        }
        toast.error(err.message || 'Invalid or expired code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || blockedUntilSeconds > 0) return;
    if (!email) {
      toast.error('Email address is missing.');
      return;
    }

    setResending(true);
    try {
      await authAPI.resendOtp({ email: email.toLowerCase() });
      toast.success('A new 6-digit code has been sent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err.isBlocked || err.status === 429) {
        const retry = err.retryAfter || 60;
        if (err.isBlocked) {
          setBlockedUntilSeconds(retry);
        } else {
          setResendCooldown(retry);
        }
        toast.error(err.message || 'Please wait before resending.');
      } else {
        toast.error(err.message || 'Failed to resend code.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!changePassword) {
      toast.error('Please enter your account password.');
      return;
    }

    setChangingEmail(true);
    try {
      const res = await authAPI.correctEmail({
        email: email.toLowerCase(),
        password: changePassword,
        newEmail: newEmail.toLowerCase(),
      });
      const updated = res.data?.email || newEmail.toLowerCase();
      setEmail(updated);
      setShowChangeEmail(false);
      setNewEmail('');
      setChangePassword('');
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
      setAttemptsRemaining(null);
      toast.success(`Email updated! Verification code sent to ${updated}`);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message || 'Failed to update email.');
    } finally {
      setChangingEmail(false);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (verifiedSuccess) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center border-green-200 bg-white shadow-xl rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-200">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Email Verified!</h1>
        <p className="text-sm text-slate-600 mb-6">
          Your account is now fully active. Redirecting you to your dashboard...
        </p>
        <Link href="/dashboard" className="btn-primary w-full justify-center">
          Go to Dashboard Now &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8 max-w-md mx-auto bg-white shadow-xl rounded-3xl border border-slate-200/80">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify Your Email</h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          We&apos;ve sent a 6-digit code to{' '}
          <strong className="text-slate-900 font-semibold break-all">{email || 'your email'}</strong>
        </p>
      </div>

      {/* IP Blocked Banner */}
      {blockedUntilSeconds > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Temporarily Blocked</p>
            <p className="text-xs text-red-700 mt-1">
              Too many incorrect attempts. For security, attempts from this IP are blocked.
            </p>
            <p className="text-xs font-mono font-bold text-red-900 mt-2 bg-red-100/80 px-2 py-1 rounded inline-block">
              Time remaining: {formatSeconds(blockedUntilSeconds)}
            </p>
          </div>
        </div>
      )}

      {/* Attempts Left Warning */}
      {attemptsRemaining !== null && blockedUntilSeconds === 0 && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <span>
            {attemptsRemaining > 0
              ? `Warning: ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before a 30-minute lockout.`
              : 'Maximum attempts reached.'}
          </span>
        </div>
      )}

      {/* OTP Inputs */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-between items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                disabled={loading || blockedUntilSeconds > 0}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            This verification code expires in 3 minutes.
          </p>
        </div>

        {/* Big Verify Button */}
        <button
          type="submit"
          disabled={loading || fullOtp.length !== 6 || blockedUntilSeconds > 0}
          className="btn-primary w-full justify-center h-12 text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="spinner" /> Verifying...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Verify Email <ArrowRight size={18} />
            </span>
          )}
        </button>
      </form>

      {/* Resend Code + 60s Timer */}
      <div className="text-center pt-2 pb-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2">Didn&apos;t receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending || blockedUntilSeconds > 0}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors"
        >
          <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : resending
            ? 'Sending new code...'
            : 'Resend new code'}
        </button>
      </div>

      {/* Change Typo'd Email */}
      <div className="text-center pt-3 border-t border-slate-100">
        {!showChangeEmail ? (
          <button
            type="button"
            onClick={() => {
              setNewEmail(email);
              setChangePassword('');
              setShowChangeEmail(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Edit3 size={13} /> Wrong email? Change it
          </button>
        ) : (
          <form onSubmit={handleUpdateEmail} className="mt-2 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correct Email Address
            </label>
            <div className="relative mb-2">
              <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="correct@example.com"
                className="w-full text-xs h-8 pl-8 pr-2 rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500"
                required
              />
            </div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={changePassword}
                  onChange={(e) => setChangePassword(e.target.value)}
                  placeholder="Password"
                  className="w-full text-xs h-8 pl-8 pr-2 rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={changingEmail || !newEmail || !changePassword}
                className="btn-primary text-xs h-8 px-3"
              >
                {changingEmail ? 'Updating...' : 'Update'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowChangeEmail(false);
                setChangePassword('');
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 mt-2 block"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Spam Folder Hint */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 leading-normal">
          💡 If you don&apos;t see the email within a minute, please check your <strong>spam or junk folder</strong>.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  Check,
} from 'lucide-react';

function PasswordStrength({ password = '' }) {
  const checks = [
    { label: 'At least 6 characters', test: password.length >= 6 },
    { label: 'One uppercase letter (A-Z)', test: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', test: /[a-z]/.test(password) },
    { label: 'One number (0-9)', test: /\d/.test(password) },
  ];
  const passed = checks.filter((c) => c.test).length;

  return (
    <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
      <div className="flex gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`flex-1 transition-all duration-300 ${
              passed >= bar
                ? passed <= 2
                  ? 'bg-amber-500'
                  : 'bg-green-600'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
        {checks.map(({ label, test }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px]">
            <Check
              size={12}
              className={test ? 'text-green-600' : 'text-slate-300'}
            />
            <span className={test ? 'text-green-700 font-medium' : 'text-slate-400'}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForgotPasswordForm() {
  const router = useRouter();

  // Wizard steps: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [blockedUntilSeconds, setBlockedUntilSeconds] = useState(0);

  const otpInputs = useRef([]);

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

  // Focus inputs on step changes
  useEffect(() => {
    if (step === 2) {
      otpInputs.current[0]?.focus();
    }
  }, [step]);

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ─── STEP 1: Request OTP ──────────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (blockedUntilSeconds > 0) {
      toast.error('Your IP is temporarily locked. Please wait before retrying.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: cleanEmail });
      toast.success('If an account exists, a 6-digit code has been sent!');
      setStep(2);
      setResendCooldown(60);
      setAttemptsRemaining(null);
    } catch (err) {
      if (err.isBlocked || err.status === 429) {
        const retry = err.retryAfter || 1800;
        setBlockedUntilSeconds(retry);
        toast.error(`Too many attempts. Blocked for ${Math.ceil(retry / 60)} minutes.`);
      } else {
        toast.error(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: OTP Input Handlers & Verification ───────────────────────────
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) newOtp[i] = c;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(chars.length, 5);
      otpInputs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
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
    otpInputs.current[focusIndex]?.focus();
  };

  const fullOtp = otp.join('');

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (fullOtp.length !== 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    if (blockedUntilSeconds > 0) {
      toast.error('Your IP is temporarily locked. Please wait before retrying.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });
      toast.success('Code confirmed! Set your new password.');
      setResetToken(res.resetToken);
      setStep(3);
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

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || blockedUntilSeconds > 0) return;

    setResending(true);
    try {
      await authAPI.resendResetOtp({ email: email.trim().toLowerCase() });
      toast.success('A new 6-digit code has been sent!');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
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

  // ─── STEP 3: Submit New Password ──────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and a number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPasswordWithToken({
        email: email.trim().toLowerCase(),
        resetToken,
        newPassword,
      });
      toast.success('Password reset successfully!');
      setStep(4);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 4: SUCCESS SCREEN ───────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center border-green-200 bg-white shadow-xl rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-200">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Password Changed!</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <Link href="/login" className="btn-primary w-full justify-center h-12 text-base font-bold">
          Log In Now &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8 max-w-md mx-auto bg-white shadow-xl rounded-3xl border border-slate-200/80">
      {/* Wizard Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s
                ? 'w-8 bg-blue-600'
                : step > s
                ? 'w-4 bg-green-500'
                : 'w-4 bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 1: ENTER EMAIL                                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Enter your registered email address and we&apos;ll send you a 6-digit verification code.
            </p>
          </div>

          {/* Blocked State */}
          {blockedUntilSeconds > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
              <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Temporarily Blocked</p>
                <p className="text-xs text-red-700 mt-1">
                  Too many failed attempts. For security, attempts from this IP are blocked.
                </p>
                <p className="text-xs font-mono font-bold text-red-900 mt-2 bg-red-100/80 px-2 py-1 rounded inline-block">
                  Time remaining: {formatSeconds(blockedUntilSeconds)}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleRequestOtp} noValidate>
            <div className="mb-5">
              <label htmlFor="forgot-email" className="form-label text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading || blockedUntilSeconds > 0}
                  className="input-field pl-10 h-12 text-sm"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || blockedUntilSeconds > 0}
              className="btn-primary w-full justify-center h-12 text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 mb-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" /> Sending Code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Code <ArrowRight size={18} />
                </span>
              )}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-2"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 2: ENTER OTP                                                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <Mail size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Enter Verification Code
            </h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              We&apos;ve sent a 6-digit code to{' '}
              <strong className="text-slate-900 font-semibold break-all">{email}</strong>
            </p>
          </div>

          {/* Blocked State */}
          {blockedUntilSeconds > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
              <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
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

          {/* Attempts Warning */}
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

          <form onSubmit={handleVerifyOtp} noValidate>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-between items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
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

            <button
              type="submit"
              disabled={loading || fullOtp.length !== 6 || blockedUntilSeconds > 0}
              className="btn-primary w-full justify-center h-12 text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 mb-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" /> Verifying Code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Verify Code <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Resend button */}
          <div className="text-center pt-2 pb-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resending || blockedUntilSeconds > 0}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 transition-colors"
            >
              <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : resending
                ? 'Sending code...'
                : 'Resend code'}
            </button>
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 3: SET NEW PASSWORD                                         */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-xs">
              <Lock size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create New Password
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Choose a strong password to protect your account.
            </p>
          </div>

          <form onSubmit={handleResetPassword} noValidate>
            <div className="mb-4">
              <label htmlFor="new-password" className="form-label text-xs font-bold uppercase tracking-wider text-slate-700">
                New Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="input-field pl-10 pr-10 h-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="form-label text-xs font-bold uppercase tracking-wider text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="input-field pl-10 pr-10 h-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="btn-primary w-full justify-center h-12 text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" /> Updating Password...
                </span>
              ) : (
                'Set New Password'
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

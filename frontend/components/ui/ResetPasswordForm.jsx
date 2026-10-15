'use client';

import { useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle2, Building2 } from 'lucide-react';

export default function ResetPasswordForm({ tokenProp }) {
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const router = useRouter();

  // Resolve token from tokenProp -> route params [token] -> search params ?token=
  const token = tokenProp || routeParams?.token || searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-red-50 text-red-600">
          <Lock size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid Reset Link</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          The password reset token is missing or malformed. Please request a new link.
        </p>
        <Link href="/forgot-password" className="btn-primary w-full justify-center">
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword(token, { newPassword: password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
          <CheckCircle2 size={32} style={{ color: '#059669' }} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>Password Reset!</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Your password has been changed. Redirecting to login...
        </p>
        <Link href="/login" className="btn-primary w-full justify-center">
          Proceed to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
          <Building2 size={24} style={{ color: '#2563eb' }} />
        </div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>Set new password</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.375rem' }}>
          Choose a strong password for your BizPrimeHub account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* New Password */}
        <div className="mb-4">
          <label htmlFor="reset-pw" className="form-label">New Password</label>
          <div className="relative">
            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="reset-pw"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Min 6 chars (A-Z, a-z, 0-9)"
              className={`input-field ${error && !confirmPassword ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              autoComplete="new-password"
              aria-invalid={!!error}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-5">
          <label htmlFor="confirm-pw" className="form-label">Confirm Password</label>
          <div className="relative">
            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="confirm-pw"
              type={showConfirmPw ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="Re-enter your new password"
              className={`input-field ${error && confirmPassword ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              autoComplete="new-password"
              aria-invalid={!!error}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
            >
              {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.35rem' }}>{error}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
          style={{ height: '2.75rem', fontSize: '0.9375rem' }}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
          <Link href="/login" style={{ color: '#2563eb' }}>
            &larr; Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}

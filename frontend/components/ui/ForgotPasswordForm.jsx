'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.toLowerCase() });
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
          <CheckCircle2 size={32} style={{ color: '#059669' }} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
        </p>
        <Link href="/login" className="btn-primary w-full justify-center">
          Back to Login
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
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>Forgot your password?</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.375rem' }}>
          No worries. Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-5">
          <label htmlFor="forgot-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              className={`input-field ${error ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              autoComplete="email"
              aria-describedby={error ? 'forgot-error' : undefined}
              aria-invalid={!!error}
            />
          </div>
          {error && <p id="forgot-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full mb-4"
          disabled={loading}
          style={{ height: '2.75rem', fontSize: '0.9375rem' }}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2"
          style={{ color: '#6b7280', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={14} /> Back to login
        </Link>
      </form>
    </div>
  );
}

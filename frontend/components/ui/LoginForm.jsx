'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login({ email: form.email.toLowerCase(), password: form.password });
      toast.success('Welcome back!');
      if (res?.data?.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
          <Building2 size={24} style={{ color: '#2563eb' }} />
        </div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>Welcome back</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.375rem' }}>
          Sign in to your PKbizMap account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="mb-4">
          <label htmlFor="login-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
              placeholder="you@example.com"
              className={`input-field ${errors.email ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              autoComplete="email"
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && <p id="login-email-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="form-label" style={{ margin: 0 }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: '#2563eb' }}>Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
              placeholder="Your password"
              className={`input-field ${errors.password ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              autoComplete="current-password"
              aria-describedby={errors.password ? 'login-pw-error' : undefined}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p id="login-pw-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
          style={{ height: '2.75rem', fontSize: '0.9375rem' }}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#2563eb', fontWeight: 500 }}>
          Create one free
        </Link>
      </p>
    </div>
  );
}

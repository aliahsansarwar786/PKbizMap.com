'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, Mail, Lock, User, Check } from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 6 characters', test: password.length >= 6 },
    { label: 'Uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Number', test: /\d/.test(password) },
  ];
  const passed = checks.filter((c) => c.test).length;
  const colors = ['#dc2626', '#f59e0b', '#d97706', '#059669', '#059669'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i < passed ? colors[passed] : '#e5e7eb' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map(({ label, test }) => (
          <div key={label} className="flex items-center gap-1">
            <Check size={10} style={{ color: test ? '#059669' : '#d1d5db', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', color: test ? '#059669' : '#9ca3af' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const router = useRouter();

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain an uppercase letter';
    else if (!/[a-z]/.test(form.password)) errs.password = 'Password must contain a lowercase letter';
    else if (!/\d/.test(form.password)) errs.password = 'Password must contain a number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.toLowerCase(), password: form.password });
      toast.success('Account created! Welcome to BizPrimeHub.');
      router.push('/dashboard');
    } catch (err) {
      if (err.status === 409) {
        setErrors({ email: 'An account with this email already exists.' });
      } else {
        toast.error(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  return (
    <div className="card p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
          <Building2 size={24} style={{ color: '#2563eb' }} />
        </div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1f2937' }}>Create your account</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.375rem' }}>
          Join BizPrimeHub — it&apos;s completely free
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="reg-name" className="form-label">Full name</label>
          <div className="relative">
            <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="reg-name"
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="John Smith"
              className={`input-field ${errors.name ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'reg-name-error' : undefined}
            />
          </div>
          {errors.name && <p id="reg-name-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="reg-email" className="form-label">Email address</label>
          <div className="relative">
            <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className={`input-field ${errors.email ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
          </div>
          {errors.email && <p id="reg-email-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label htmlFor="reg-password" className="form-label">Password</label>
          <div className="relative">
            <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} aria-hidden="true" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Create a strong password"
              className={`input-field ${errors.password ? 'error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reg-pw-error' : undefined}
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
          {errors.password && <p id="reg-pw-error" role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.password}</p>}
          <PasswordStrength password={form.password} />
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
          style={{ height: '2.75rem', fontSize: '0.9375rem' }}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Creating account...' : 'Create free account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>Sign in</Link>
      </p>
    </div>
  );
}

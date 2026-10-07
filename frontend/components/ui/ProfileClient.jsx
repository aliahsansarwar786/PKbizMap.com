'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, User, Lock, Eye, EyeOff, Save } from 'lucide-react';

export default function ProfileClient() {
  const { user, isAuthenticated, loading: authLoading, updateUser, refetch } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=2563eb&color=fff&size=128`);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Avatar must be under 2MB.'); return; }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast.error('Only JPG, PNG, or WebP allowed.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error('Name must be at least 2 characters.'); return; }
    if (!email.trim()) { toast.error('Email cannot be empty.'); return; }
    
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      if (avatarFile) formData.append('avatar', avatarFile);
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      await refetch();
      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) errs.newPassword = 'New password must be at least 6 characters';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwLoading(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="skeleton rounded-xl h-48" />
        <div className="skeleton rounded-xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <div className="card p-6">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} style={{ color: '#2563eb' }} /> Profile Information
        </h2>
        <form onSubmit={handleProfileSubmit}>
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <Image
                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=2563eb&color=fff&size=128`}
                alt="Profile avatar"
                width={80}
                height={80}
                className="rounded-full object-cover"
                style={{ border: '3px solid #e5e7eb' }}
              />
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: '#2563eb' }}
                aria-label="Upload avatar"
              >
                <Upload size={13} color="#fff" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="sr-only"
                />
              </label>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#1f2937' }}>{user.name}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                JPG, PNG, WebP up to 2MB
              </p>
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="profile-name" className="form-label">Display Name</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              maxLength={50}
            />
          </div>

          <div className="mb-5">
            <label htmlFor="profile-email" className="form-label">Email Address</label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Note: Changing your email will change your login address.
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={profileLoading}>
            {profileLoading ? <span className="spinner" /> : <Save size={15} />}
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} style={{ color: '#2563eb' }} /> Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="current-pw" className="form-label">Current Password</label>
            <div className="relative">
              <input
                id="current-pw"
                type={showCurrent ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => { setPwForm({ ...pwForm, currentPassword: e.target.value }); setPwErrors({ ...pwErrors, currentPassword: '' }); }}
                className={`input-field ${pwErrors.currentPassword ? 'error' : ''}`}
                style={{ paddingRight: '2.75rem' }}
                autoComplete="current-password"
                aria-invalid={!!pwErrors.currentPassword}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} aria-label={showCurrent ? 'Hide password' : 'Show password'}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwErrors.currentPassword && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{pwErrors.currentPassword}</p>}
          </div>

          <div className="mb-5">
            <label htmlFor="new-pw" className="form-label">New Password</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showNew ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwErrors({ ...pwErrors, newPassword: '' }); }}
                className={`input-field ${pwErrors.newPassword ? 'error' : ''}`}
                style={{ paddingRight: '2.75rem' }}
                autoComplete="new-password"
                aria-invalid={!!pwErrors.newPassword}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }} aria-label={showNew ? 'Hide password' : 'Show password'}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwErrors.newPassword && <p role="alert" style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{pwErrors.newPassword}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? <span className="spinner" /> : <Lock size={15} />}
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { claimAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, ShieldCheck, Mail, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';

function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.charAt(0)}*@${domain}`;
  }
  const first = local.slice(0, 2);
  const last = local.slice(-1);
  const stars = '*'.repeat(Math.max(3, Math.min(6, local.length - 3)));
  return `${first}${stars}${last}@${domain}`;
}

export default function ClaimBusinessModal({ business, isOpen, onClose }) {
  const router = useRouter();
  const hasRegisteredEmail = Boolean(business?.email && business.email.trim());

  const [claimantName, setClaimantName] = useState('');
  const [emailOption, setEmailOption] = useState(hasRegisteredEmail ? 'registered' : 'direct');
  const [directEmail, setDirectEmail] = useState('');
  const [phone, setPhone] = useState(business?.phone || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMaskedEmail, setResultMaskedEmail] = useState('');

  if (!isOpen || !business) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!claimantName.trim()) {
      toast.error('Please enter your full name or designation.');
      return;
    }

    if (emailOption === 'direct' && (!directEmail.trim() || !/^\S+@\S+\.\S+$/.test(directEmail.trim()))) {
      toast.error('Please enter a valid official/corporate email.');
      return;
    }

    if (!phone.trim()) {
      toast.error('Please enter your phone or WhatsApp number.');
      return;
    }

    setLoading(true);
    try {
      const res = await claimAPI.requestClaim(business._id, {
        claimantName: claimantName.trim(),
        emailOption,
        directEmail: directEmail.trim(),
        phone: phone.trim(),
      });

      setResultMaskedEmail(res.data?.maskedEmail || (emailOption === 'registered' ? maskEmail(business.email) : maskEmail(directEmail)));
      setSubmitted(true);
      toast.success('Verification code and link sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send claim verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToVerify = () => {
    onClose();
    router.push('/claim/verify');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                Claim This Business
              </h3>
              <p className="text-xs text-gray-500 font-medium truncate max-w-xs sm:max-w-sm">
                {business.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Verification Code Sent!
              </h4>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6 leading-relaxed">
                We have sent a 6-digit verification code and a 1-click verification link to{' '}
                <strong className="text-gray-900">{resultMaskedEmail}</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleGoToVerify}
                  className="btn-primary justify-center"
                >
                  Enter Verification Code <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary justify-center"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Note text */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                We will identify your ownership via email and send you a 6-digit verification code and a 1-click verification link to claim this listing.
              </div>

              {/* Field 1: Name / Designation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Your Full Name / Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    placeholder="e.g. Muhammad Ahsan (Branch Manager / Owner)"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Field 2: Verification Email Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Verification Email Option <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {hasRegisteredEmail && (
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        emailOption === 'registered'
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="emailOption"
                        value="registered"
                        checked={emailOption === 'registered'}
                        onChange={() => setEmailOption('registered')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-gray-900 block">
                          Send to registered business email
                        </span>
                        <span className="text-gray-500 font-mono mt-0.5 block">
                          ({maskEmail(business.email)})
                        </span>
                      </div>
                    </label>
                  )}

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      emailOption === 'direct'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="emailOption"
                      value="direct"
                      checked={emailOption === 'direct'}
                      onChange={() => setEmailOption('direct')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900 block">
                        Use my direct official / corporate email
                      </span>
                      <span className="text-gray-500 mt-0.5 block">
                        Send verification to your company address
                      </span>
                    </div>
                  </label>
                </div>

                {emailOption === 'direct' && (
                  <div className="mt-2.5 animate-in fade-in duration-150">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required={emailOption === 'direct'}
                        value={directEmail}
                        onChange={(e) => setDirectEmail(e.target.value)}
                        placeholder="yourname@company.com"
                        className="input-field pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Phone / WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Phone / WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center text-sm py-2.5 font-bold shadow-md shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Sending Verification...
                    </>
                  ) : (
                    <>Send Verification Code &amp; Link</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

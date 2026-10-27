'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { claimAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, ShieldCheck, Mail, Phone, User, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923106131361';
  const hasRegisteredEmail = Boolean(business?.email && business.email.trim());

  const [claimantName, setClaimantName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMaskedEmail, setResultMaskedEmail] = useState('');
  const [claimId, setClaimId] = useState('');

  if (!isOpen || !business) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!claimantName.trim()) {
      toast.error('Please enter your full name or designation.');
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
        emailOption: 'registered',
        phone: phone.trim(),
      });

      if (res.data?.claimId) {
        setClaimId(res.data.claimId);
      }
      setResultMaskedEmail(res.data?.maskedEmail || maskEmail(business.email));
      setSubmitted(true);
      toast.success('Verification code sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send claim verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToVerify = () => {
    onClose();
    const params = new URLSearchParams();
    if (claimId) params.set('claimId', claimId);
    if (business.email) params.set('email', business.email);
    router.push(`/claim/verify?${params.toString()}`);
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
          {!hasRegisteredEmail ? (
            /* Case A: Business has NO registered email on file */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
                <AlertCircle size={30} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                No Registered Email on File
              </h4>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6 leading-relaxed">
                This business has no registered email on file. To claim it, contact the website owner on WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-md transition-colors"
                >
                  <Phone size={16} />
                  <span>Chat with Website Owner</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary justify-center"
                >
                  Close
                </button>
              </div>
            </div>
          ) : submitted ? (
            /* Case B: Verification Code Sent successfully */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Verification Code Sent!
              </h4>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mb-6 leading-relaxed">
                We have sent a 6-digit verification code to{' '}
                <strong className="text-gray-900">{resultMaskedEmail}</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center mb-6">
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

              {/* Bottom WhatsApp support link */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  For any issue with your claim,{' '}
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>contact the website owner on WhatsApp</span>
                  </a>
                </p>
              </div>
            </div>
          ) : (
            /* Case C: Active claim form with registered email */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Note text: code-only wording */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                We will send a 6-digit verification code to the business&apos;s registered email to confirm your ownership.
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

              {/* Field 2: Registered Business Email (masked display only, no direct option) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Registered Business Email
                </label>
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-gray-800 block truncate">
                      {maskEmail(business.email)}
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      Verification code will be sent to this email address
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 3: Phone / WhatsApp Number (EMPTY by default, placeholder only, business phone never shown) */}
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
                    placeholder="Your phone / WhatsApp number"
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
                      <span className="spinner" /> Sending Verification Code...
                    </>
                  ) : (
                    <>Send Verification Code</>
                  )}
                </button>
              </div>

              {/* Bottom WhatsApp support link */}
              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  For any issue with your claim,{' '}
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    contact the website owner on WhatsApp
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

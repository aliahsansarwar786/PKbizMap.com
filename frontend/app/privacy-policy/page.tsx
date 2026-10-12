import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Cookie, FileText, Bell, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | BizPrimeHub Pakistan Business Directory',
  description: 'BizPrimeHub Privacy Policy explains how we collect, use, store, and protect user and business listing data across Pakistan, including cookie policy and third-party advertising transparency.',
  alternates: {
    canonical: 'https://bizprimehub.vercel.app/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-slate-50 min-h-screen">
        {/* Header Banner */}
        <section className="bg-gradient-to-b from-blue-900 via-slate-900 to-[#0a0f1c] text-white py-14 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <ShieldCheck size={14} /> Transparency & Data Protection
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Effective Date: March 2026 | Last Updated: March 2026
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
              
              {/* Introduction */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="text-blue-600 shrink-0" size={22} /> 1. Introduction
                </h2>
                <p>
                  Welcome to <strong>BizPrimeHub</strong> (accessible at <a href="https://bizprimehub.vercel.app/" className="text-blue-600 hover:underline">https://bizprimehub.vercel.app/</a>). We are dedicated to providing a transparent, reliable, and user-friendly digital business directory for Pakistani consumers and enterprise owners. This Privacy Policy outlines our standards regarding the collection, processing, storage, and safeguarding of personal and commercial data when you access our platform.
                </p>
                <p className="mt-3">
                  By accessing BizPrimeHub, registering an account, or submitting a business profile, you consent to the data practices described in this policy.
                </p>
              </div>

              {/* Information Collection */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="text-blue-600 shrink-0" size={22} /> 2. Information We Collect
                </h2>
                <p>We collect information across two distinct categories:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>
                    <strong>Public Business Listing Data:</strong> When owners list a business, we collect public details intended for directory discovery: Business Name, Category, City, Physical Address, Public Phone Number, WhatsApp Number, Email, Operating Hours, Logos, and Storefront Imagery.
                  </li>
                  <li>
                    <strong>User Account Information:</strong> When creating a user or manager account, we collect your name, account email address, and encrypted authentication credentials.
                  </li>
                  <li>
                    <strong>Technical & Usage Analytics:</strong> We automatically log non-identifiable browser information including IP addresses, browser versions, operating systems, referring URLs, and page visit durations to maintain server stability.
                  </li>
                </ul>
              </div>

              {/* Cookies & Tracking */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Cookie className="text-blue-600 shrink-0" size={22} /> 3. Cookies, Web Beacons & Analytics
                </h2>
                <p>
                  BizPrimeHub uses standard session cookies to remember authentication tokens and user preferences (such as search filters and dark/light display settings).
                </p>
                <p className="mt-3">
                  <strong>Third-Party Analytics:</strong> We may utilize privacy-respecting analytics services to measure aggregate platform metrics such as peak traffic hours and popular city directories. These analytics cookies do not store personally sensitive records. You can modify your browser settings to decline cookies at any time, though some account login features may require active session cookies.
                </p>
              </div>

              {/* Advertising & AdSense Transparency */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-blue-600 shrink-0" size={22} /> 4. Advertising & Google AdSense Transparency
                </h2>
                <p>
                  To support free directory listings for Pakistani local vendors, BizPrimeHub may display third-party advertisements, including services such as <strong>Google AdSense</strong>.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>
                    Third-party ad vendors, including Google, use cookies (such as the DoubleClick cookie) to serve relevant advertisements based on a user’s prior visits to this website or other online services.
                  </li>
                  <li>
                    Users can opt out of personalized advertising by visiting Google’s <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ads Settings</a> or by navigating to <a href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">aboutads.info</a>.
                  </li>
                  <li>
                    BizPrimeHub does not share confidential user contact details (such as account passwords or private verification documents) with third-party advertising networks.
                  </li>
                </ul>
              </div>

              {/* Listing Accuracy & Removal Requests */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-blue-600 shrink-0" size={22} /> 5. Business Listing Accuracy & Removal Requests
                </h2>
                <p>
                  All commercial details published on BizPrimeHub are provided by business owners or gathered from public directory records. We strive for accuracy but recommend that consumers verify critical requirements directly via phone or WhatsApp.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3 text-amber-900 text-sm">
                  <strong>Profile Claim or Removal:</strong> If you are the authorized representative of a business listed on BizPrimeHub and wish to update, verify, or permanently remove your listing, contact us at <code>ahsanalisarwar555@gmail.com</code> with proof of ownership. Requests are reviewed and processed within 3 to 5 business days.
                </div>
              </div>

              {/* Applicable Pakistani Laws */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Bell className="text-blue-600 shrink-0" size={22} /> 6. Applicable Laws & Compliance in Pakistan
                </h2>
                <p>
                  BizPrimeHub operates in accordance with applicable electronic transaction and cyber data principles within the Islamic Republic of Pakistan, including relevant directives under the <em>Prevention of Electronic Crimes Act (PECA 2016)</em> and emerging electronic commerce data protection frameworks.
                </p>
              </div>

              {/* Contact Information */}
              <div className="border-t border-slate-100 pt-8">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Questions or Privacy Inquiries?</h3>
                  <p className="text-blue-800 text-sm">
                    If you have questions regarding this Privacy Policy or wish to exercise your data rights, please contact our support desk:
                  </p>
                  <div className="mt-3 text-sm text-blue-950 font-medium space-y-1">
                    <p><strong>Platform:</strong> BizPrimeHub (Pakistan)</p>
                    <p><strong>Email:</strong> <a href="mailto:ahsanalisarwar555@gmail.com" className="underline">ahsanalisarwar555@gmail.com</a></p>
                    <p><strong>Support Helpline:</strong> +92 310 6131361</p>
                    <p><strong>Official Contact Page:</strong> <Link href="/contact" className="underline">bizprimehub.vercel.app/contact</Link></p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

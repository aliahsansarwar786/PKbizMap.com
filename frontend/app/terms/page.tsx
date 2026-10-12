import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Scale, CheckCircle2, AlertOctagon, ShieldAlert, FileText, Globe } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | BizPrimeHub Pakistan Business Directory',
  description: 'BizPrimeHub Terms of Service govern platform access, user accounts, business listing submissions, intellectual property, accuracy warranties, and community compliance across Pakistan.',
  alternates: {
    canonical: 'https://bizprimehub.vercel.app/terms',
  },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-slate-50 min-h-screen">
        {/* Header Banner */}
        <section className="bg-gradient-to-b from-blue-900 via-slate-900 to-[#0a0f1c] text-white py-14 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <Scale size={14} /> Legal Agreement & Guidelines
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Terms of Service
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
              
              {/* 1. Acceptance */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="text-blue-600 shrink-0" size={22} /> 1. Acceptance of Terms
                </h2>
                <p>
                  These Terms of Service (the &quot;Terms&quot;) constitute a legally binding agreement between you (whether as an individual visitor or an authorized representative of an enterprise) and <strong>BizPrimeHub</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
                </p>
                <p className="mt-3">
                  By accessing, browsing, submitting content to, or registering on <a href="https://bizprimehub.vercel.app/" className="text-blue-600 hover:underline">https://bizprimehub.vercel.app/</a>, you signify your unreserved assent to these Terms. If you do not agree with any part of these Terms, you must discontinue using this platform immediately.
                </p>
              </div>

              {/* 2. Platform Purpose & Directory Model */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="text-blue-600 shrink-0" size={22} /> 2. Directory Model & Nature of Service
                </h2>
                <p>
                  BizPrimeHub is an informational online directory dedicated to listing and indexing local services, retail outlets, professional providers, and establishments across Pakistan. BizPrimeHub acts as an intermediary discovery catalog:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>We do not manufacture, sell, guarantee, or directly deliver goods or services listed by independent vendors.</li>
                  <li>Any commercial transactions, appointments, payments, or disputes arising between consumers and listed businesses remain strictly between the respective parties.</li>
                </ul>
              </div>

              {/* 3. Business Listing Submissions & Verification */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-blue-600 shrink-0" size={22} /> 3. Business Submissions & Content Accuracy
                </h2>
                <p>
                  When submitting a business for inclusion on BizPrimeHub via our <Link href="/add-business" className="text-blue-600 hover:underline">Add Business portal</Link>, you represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>You are the business proprietor, managing partner, or authorized marketing agent.</li>
                  <li>All supplied contact details, addresses, and licensing descriptions are accurate, up-to-date, and non-deceptive.</li>
                  <li>You will promptly update or request modification of your listing if your location, telephone numbers, or operating status changes.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-500">
                  <em>Note on Verification Badges:</em> Verification icons reflect internal administrative identity checks. A verification badge does not represent an endorsement, warranty, or financial guarantee by BizPrimeHub regarding the business&apos;s product performance.
                </p>
              </div>

              {/* 4. Prohibited Content & Community Standards */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertOctagon className="text-red-600 shrink-0" size={22} /> 4. Prohibited Content & Abuse
                </h2>
                <p>Users and business registrants are strictly forbidden from submitting content that:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>Promotes unlawful activities, contraband substances, or unlicensed weapons.</li>
                  <li>Violates trademark, copyright, or intellectual property rights of third parties.</li>
                  <li>Contains fraudulent schemes, counterfeit goods, or deceptive financial solicitations.</li>
                  <li>Includes malicious software, automated scraping bots, or spam backlinks.</li>
                  <li>Violates the <em>Prevention of Electronic Crimes Act (PECA 2016)</em> or any municipal ordinance in Pakistan.</li>
                </ul>
                <p className="mt-3">
                  We reserve the unilateral right to suspend, redact, or permanently terminate listings or user accounts that violate these restrictions without prior notice.
                </p>
              </div>

              {/* 5. Limitation of Liability */}
              <div className="border-t border-slate-100 pt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldAlert className="text-amber-600 shrink-0" size={22} /> 5. Disclaimer of Warranties & Limitation of Liability
                </h2>
                <p>
                  BizPrimeHub is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. To the fullest extent permissible by applicable law:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>We do not guarantee uninterrupted server uptime, error-free navigation, or absolute listing completeness.</li>
                  <li>BizPrimeHub and its operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of listed phone numbers, external WhatsApp interactions, or third-party business services.</li>
                </ul>
              </div>

              {/* 6. Jurisdiction & Contact */}
              <div className="border-t border-slate-100 pt-8">
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">6. Governing Law & Inquiries</h3>
                  <p className="text-slate-700 text-sm">
                    These Terms are governed by and construed in accordance with the substantive laws of Pakistan. Any legal inquiries or takedown requests regarding listed intellectual property should be submitted to:
                  </p>
                  <div className="mt-3 text-sm text-slate-900 font-medium space-y-1">
                    <p><strong>Admin Contact:</strong> Ahsan Ali (BizPrimeHub)</p>
                    <p><strong>Email:</strong> <a href="mailto:ahsanalisarwar555@gmail.com" className="text-blue-600 underline">ahsanalisarwar555@gmail.com</a></p>
                    <p><strong>Phone / WhatsApp:</strong> +92 310 6131361</p>
                    <p><strong>Official Contact Form:</strong> <Link href="/contact" className="text-blue-600 underline">bizprimehub.vercel.app/contact</Link></p>
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

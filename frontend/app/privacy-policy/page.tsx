import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  FileText,
  Cookie,
  Globe,
  Clock,
  UserX,
  UserCheck,
  Sliders,
  RefreshCw,
  Mail,
  Edit,
  Building2,
  BookOpen,
  Info,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'BizPrimeHub Privacy Policy explains how we collect, process, store, and safeguard your personal information when using our online business directory services.',
  alternates: {
    canonical: 'https://www.bizprimehub.com/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | BizPrimeHub',
    description:
      'BizPrimeHub Privacy Policy explains how we collect, process, store, and safeguard your personal information when using our online business directory services.',
    url: 'https://www.bizprimehub.com/privacy-policy',
    type: 'website',
    images: ['/og-default.jpg'],
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
              <ShieldCheck size={14} /> Transparency &amp; Data Protection
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Privacy Policy
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Last updated: 17 October 2026
            </p>
          </div>
        </section>

        {/* Content Body */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
              
              {/* Preamble */}
              <div className="space-y-4 text-slate-800">
                <p>
                  This Privacy Policy for <strong>Ahsan Ali, trading as BizPrimeHub</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
                  describes how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal
                  information when you use our services (&quot;Services&quot;), including when you visit{' '}
                  <a href="https://www.bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                    https://www.bizprimehub.com
                  </a>
                  .
                </p>
                <p>
                  <strong>Questions or concerns?</strong> Reading this Privacy Policy will help you understand your privacy rights
                  and choices. We are responsible for making decisions about how your personal information is processed. If you do
                  not agree with our policies and practices, please do not use our Services.
                </p>
              </div>

              {/* Summary of Key Points */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-6 sm:p-7 space-y-4 text-slate-800">
                <h2 className="text-base font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <Info size={18} className="text-blue-600" /> Summary of Key Points
                </h2>
                <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may
                    process personal information depending on how you interact with us and the Services, the choices you make, and the
                    products and features you use.{' '}
                    <a href="#section-1" className="text-blue-600 hover:underline font-medium">
                      Learn more about personal information you disclose to us.
                    </a>
                  </p>
                  <p>
                    <strong>Do we process any sensitive personal information?</strong> No. We do not process sensitive personal
                    information.
                  </p>
                  <p>
                    <strong>Do we collect any information from third parties?</strong> No. We do not collect personal information from
                    third parties.
                  </p>
                  <p>
                    <strong>How do we process your information?</strong> We process your information to provide, improve, and administer
                    our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process
                    your information for other purposes with your consent. We process your information only when we have a valid legal
                    reason to do so.{' '}
                    <a href="#section-2" className="text-blue-600 hover:underline font-medium">
                      Learn more about how we process your information.
                    </a>
                  </p>
                  <p>
                    <strong>In what situations and with which parties do we share personal information?</strong> We may share information
                    in specific situations and with specific third parties, such as the service providers that host and operate our
                    Services. We do not sell your personal information.{' '}
                    <a href="#section-3" className="text-blue-600 hover:underline font-medium">
                      Learn more about when and with whom we share your personal information.
                    </a>
                  </p>
                  <p>
                    <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law
                    may mean you have certain rights regarding your personal information.{' '}
                    <a href="#section-8" className="text-blue-600 hover:underline font-medium">
                      Learn more about your privacy rights.
                    </a>
                  </p>
                  <p>
                    <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data
                    subject access request through our contact form at{' '}
                    <Link href="/contact" className="text-blue-600 hover:underline font-medium">
                      https://www.bizprimehub.com/contact
                    </Link>
                    , or by contacting us at{' '}
                    <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                      info@bizprimehub.com
                    </a>
                    . We will consider and act upon any request in accordance with applicable data protection laws.
                  </p>
                  <p className="pt-1">
                    <strong>Want to learn more about what we do with any information we collect?</strong> Review the Privacy Policy in full below.
                  </p>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-7">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" /> Table of Contents
                </h2>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-700">
                  <li><a href="#section-1" className="hover:text-blue-600 transition-colors">1. What Information Do We Collect?</a></li>
                  <li><a href="#section-2" className="hover:text-blue-600 transition-colors">2. How Do We Process Your Information?</a></li>
                  <li><a href="#section-3" className="hover:text-blue-600 transition-colors">3. When &amp; With Whom We Share Info</a></li>
                  <li><a href="#section-4" className="hover:text-blue-600 transition-colors">4. Cookies &amp; Tracking Technologies</a></li>
                  <li><a href="#section-5" className="hover:text-blue-600 transition-colors">5. International Info Transfers</a></li>
                  <li><a href="#section-6" className="hover:text-blue-600 transition-colors">6. How Long We Keep Your Information</a></li>
                  <li><a href="#section-7" className="hover:text-blue-600 transition-colors">7. Information From Minors</a></li>
                  <li><a href="#section-8" className="hover:text-blue-600 transition-colors">8. What Are Your Privacy Rights?</a></li>
                  <li><a href="#section-9" className="hover:text-blue-600 transition-colors">9. Controls for Do-Not-Track Features</a></li>
                  <li><a href="#section-10" className="hover:text-blue-600 transition-colors">10. Policy Updates</a></li>
                  <li><a href="#section-11" className="hover:text-blue-600 transition-colors">11. How Can You Contact Us?</a></li>
                  <li><a href="#section-12" className="hover:text-blue-600 transition-colors">12. Review, Update, or Delete Data</a></li>
                  <li><a href="#section-13" className="hover:text-blue-600 transition-colors">13. Public Business Listings</a></li>
                </ol>
              </div>

              {/* 1. WHAT INFORMATION DO WE COLLECT? */}
              <div id="section-1" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="text-blue-600 shrink-0" size={22} />
                  1. What Information Do We Collect?
                </h2>
                
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">Personal information you disclose to us</h3>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We collect personal information that you provide to us.
                </p>
                <p>
                  We collect personal information that you voluntarily provide to us when you register on the Services,
                  submit a business listing, post a review, upload photos, contact us, or otherwise interact with the Services.
                </p>
                <p className="mt-3 font-medium text-slate-800">The personal information we collect may include:</p>
                <ul className="list-disc pl-6 space-y-1.5 mt-2 text-slate-600">
                  <li>Names</li>
                  <li>Phone numbers</li>
                  <li>Email addresses</li>
                  <li>Mailing addresses</li>
                  <li>Passwords (stored securely; never shared)</li>
                  <li>Business listing photos and payment receipt images you upload</li>
                </ul>
                <p className="mt-4">
                  <strong>Sensitive Information.</strong> We do not process sensitive information.
                </p>
                <p className="mt-3">
                  All personal information that you provide to us must be true, complete, and accurate, and you must notify us of
                  any changes to such personal information.
                </p>
                <p className="mt-3">
                  <strong>Payment information.</strong> BizPrimeHub does not process online payments itself. If a listing fee
                  applies, you pay directly through your own bank app or wallet (for example, via Raast QR or bank transfer to our
                  JazzCash or bank account). We never see or store your card numbers or bank login details. We only receive the payment
                  receipt image you choose to upload so we can confirm your payment.
                </p>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2">Information automatically collected</h3>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.
                </p>
                <div className="space-y-3">
                  <p>
                    We automatically collect certain information when you visit, use, or navigate the Services. This information does
                    not reveal your specific identity (like your name or contact information) but includes log and usage data such as
                    your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device
                    name, and information about how and when you use our Services. This information is primarily needed to maintain the
                    security and operation of our Services (for example, OTP rate-limiting and fraud prevention), and for our internal
                    analytics and reporting purposes.
                  </p>
                  <p>
                    Like many businesses, we also collect information through cookies and similar technologies. See{' '}
                    <a href="#section-4" className="text-blue-600 hover:underline font-medium">
                      Section 4
                    </a>{' '}
                    for details.
                  </p>
                  <p>
                    We do not collect device data beyond the above, and we do not track your physical location. Any country or city
                    shown on the Services is one you select yourself; we do not detect or store your device location.
                  </p>
                </div>
              </div>

              {/* 2. HOW DO WE PROCESS YOUR INFORMATION? */}
              <div id="section-2" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-blue-600 shrink-0" size={22} />
                  2. How Do We Process Your Information?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
                </p>
                <p>
                  We process your personal information for a variety of reasons, depending on how you interact with our Services,
                  including:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>To deliver and facilitate the Services, including user registration, business listings, reviews, and account management.</li>
                  <li>To send you administrative information, such as OTP verification codes, welcome emails, and listing approval updates.</li>
                  <li>To respond to your inquiries and offer you support.</li>
                  <li>
                    To send you marketing and promotional communications, such as our newsletter. You may unsubscribe at any time by
                    clicking the unsubscribe link at the bottom of our marketing emails.
                  </li>
                  <li>To evaluate and improve our Services and identify usage trends.</li>
                  <li>To protect our Services, for example for fraud monitoring and OTP rate-limiting.</li>
                  <li>To comply with our legal obligations.</li>
                </ul>
              </div>

              {/* 3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION? */}
              <div id="section-3" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="text-blue-600 shrink-0" size={22} />
                  3. When and With Whom Do We Share Your Personal Information?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We share information only with the service providers that operate our Services, and in the specific situations described in this section. We do not sell your personal information.
                </p>
                <p>We may need to share your personal information in the following situations:</p>
                <ul className="list-disc pl-6 space-y-3 mt-3 text-slate-600">
                  <li>
                    <strong>Service Providers.</strong> We share your information with the third parties that help us operate the Services:
                    <ul className="list-circle pl-6 mt-1.5 space-y-1 text-slate-600">
                      <li>Website hosting service providers (Vercel)</li>
                      <li>Data storage service providers (MongoDB Atlas, Cloudinary)</li>
                      <li>Communication and collaboration tools (Gmail, for transactional emails)</li>
                      <li>Mapping services (Google Maps, for location maps)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during
                    negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business
                    to another company.
                  </li>
                  <li>
                    <strong>Legal Obligations.</strong> We may disclose your information where we are legally required to do so in order
                    to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.
                  </li>
                </ul>
                <p className="mt-4 font-medium text-slate-900">
                  We do not share your personal information with business affiliates, business partners, or third-party advertisers, and
                  we do not sell your personal information to anyone.
                </p>
              </div>

              {/* 4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES? */}
              <div id="section-4" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Cookie className="text-blue-600 shrink-0" size={22} />
                  4. Do We Use Cookies and Other Tracking Technologies?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We use cookies to keep you logged in and to operate basic site functions. Google Maps may set its own cookies when maps are displayed.
                </p>
                <div className="space-y-3">
                  <p>
                    We use cookies and similar tracking technologies to maintain the security of our Services, keep you logged in
                    (session cookies), and assist with basic site functions. Google Maps, which we use for location maps, may set its
                    own cookies in line with Google&apos;s Terms of Service.
                  </p>
                  <p>
                    We do not use advertising cookies, targeting cookies, or analytics trackers. A dedicated Cookie Policy will be
                    published on the Services.
                  </p>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 mt-3 space-y-2">
                    <p className="font-bold text-slate-900">Advertising &amp; Google AdSense Transparency</p>
                    <p className="text-sm leading-relaxed">
                      In the future, BizPrimeHub may display third-party advertisements, including Google AdSense. Third-party ad
                      vendors, including Google, may use cookies (such as the DoubleClick cookie) to serve advertisements based on your
                      prior visits to this and other websites. You can opt out of personalized advertising via Google&apos;s Ads Settings
                      (
                      <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        adssettings.google.com
                      </a>
                      ) or aboutads.info (
                      <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        www.aboutads.info
                      </a>
                      ). We do not share your confidential account details (such as passwords) with advertising networks.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY? */}
              <div id="section-5" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="text-blue-600 shrink-0" size={22} />
                  5. Is Your Information Transferred Internationally?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We may transfer, store, and process your information in countries other than your own.
                </p>
                <p>
                  Our servers are located in the United States. Regardless of your location, please be aware that your information
                  may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties
                  with whom we may share your personal information (see &quot;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&quot;
                  above), including facilities in the United States and other countries.
                </p>
              </div>

              {/* 6. HOW LONG DO WE KEEP YOUR INFORMATION? */}
              <div id="section-6" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="text-blue-600 shrink-0" size={22} />
                  6. How Long Do We Keep Your Information?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We keep your information for as long as you have an account with us.
                </p>
                <div className="space-y-3">
                  <p>
                    We will only keep your personal information for as long as it is necessary for the purposes set out in this
                    Privacy Policy — that is, for as long as you have an account with us — unless a longer retention period is
                    required or permitted by law (such as tax, accounting, or other legal requirements).
                  </p>
                  <p>
                    When you request deletion of your account, we will delete or anonymise your personal information, including your
                    business listings, reviews, and uploaded images. If this is not immediately possible (for example, because your
                    personal information has been stored in backup archives), then we will securely store your personal information and
                    isolate it from any further processing until deletion is possible.
                  </p>
                </div>
              </div>

              {/* 7. DO WE COLLECT INFORMATION FROM MINORS? */}
              <div id="section-7" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <UserX className="text-blue-600 shrink-0" size={22} />
                  7. Do We Collect Information From Minors?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: We do not knowingly collect data from or market to children under 18 years of age.
                </p>
                <p>
                  You must be at least 18 years old to use the Services. We do not knowingly collect, solicit data from, or market to
                  children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you
                  represent that you are at least 18 years of age. If we learn that personal information from users less than 18 years of
                  age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from
                  our records. If you become aware of any data we may have collected from children under age 18, please contact us at{' '}
                  <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                    info@bizprimehub.com
                  </a>
                  .
                </p>
              </div>

              {/* 8. WHAT ARE YOUR PRIVACY RIGHTS? */}
              <div id="section-8" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <UserCheck className="text-blue-600 shrink-0" size={22} />
                  8. What Are Your Privacy Rights?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: You may review, change, or terminate your account at any time.
                </p>
                <div className="space-y-3">
                  <p>
                    If you are located in the United States, depending on your state of residence you may have the right to request
                    access to the personal information we collect from you, details about how we have processed it, correction of
                    inaccuracies, or deletion of your personal information. You may also have the right to appeal our decision regarding
                    your request, using the same contact details below.
                  </p>
                  <p>
                    <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information,
                    you may withdraw your consent at any time by contacting us using the contact details provided in the section{' '}
                    <a href="#section-11" className="text-blue-600 hover:underline font-medium">
                      &quot;HOW CAN YOU CONTACT US ABOUT THIS POLICY?&quot;
                    </a>{' '}
                    below. However, please note that this will not affect the lawfulness of the processing before its withdrawal.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                    <p className="font-bold text-slate-900">Account Information</p>
                    <p>If you would at any time like to review or change the information in your account or terminate your account, you can:</p>
                    <ul className="list-disc pl-6 space-y-1 text-slate-600 text-sm">
                      <li>Log in to your account settings and update your user account, or</li>
                      <li>
                        Contact us at{' '}
                        <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline">
                          info@bizprimehub.com
                        </a>{' '}
                        or through our contact form at{' '}
                        <Link href="/contact" className="text-blue-600 hover:underline">
                          https://www.bizprimehub.com/contact
                        </Link>
                        .
                      </li>
                    </ul>
                    <p className="text-xs text-slate-500 pt-2 leading-relaxed">
                      Upon your request to terminate your account, we will deactivate or delete your account and information from our
                      active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems,
                      assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
                    </p>
                  </div>

                  <p>
                    <strong>California residents:</strong> In the last 12 months we have collected and disclosed the following categories
                    of personal information: identifiers (such as your name and email address) and California Customer Records
                    information (such as your name, address, and telephone number). We retain these for as long as you have an account
                    with us. We do not sell your personal information and have not sold it in the last 12 months.
                  </p>
                  <p>
                    If you have questions or comments about your privacy rights, you may email us at{' '}
                    <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                      info@bizprimehub.com
                    </a>
                    .
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                    BizPrimeHub is operated from Pakistan and complies with applicable Pakistani law, including the{' '}
                    <em>Prevention of Electronic Crimes Act (PECA 2016)</em>.
                  </p>
                </div>
              </div>

              {/* 9. CONTROLS FOR DO-NOT-TRACK FEATURES */}
              <div id="section-9" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Sliders className="text-blue-600 shrink-0" size={22} />
                  9. Controls for Do-Not-Track Features
                </h2>
                <p>
                  Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;)
                  feature or setting you can activate to signal your privacy preference not to have data about your online browsing
                  activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing
                  DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism
                  that automatically communicates your choice not to be tracked online, including Global Privacy Control (GPC). We do not
                  track your online browsing activity in any case. If a standard for online tracking is adopted that we must follow in the
                  future, we will inform you about that practice in a revised version of this Privacy Policy.
                </p>
              </div>

              {/* 10. DO WE MAKE UPDATES TO THIS POLICY? */}
              <div id="section-10" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="text-blue-600 shrink-0" size={22} />
                  10. Do We Make Updates to This Policy?
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200/80 rounded-lg px-3 py-1.5 inline-block mb-3">
                  In Short: Yes, we will update this policy as necessary to stay compliant with relevant laws.
                </p>
                <p>
                  We may update this Privacy Policy from time to time. The updated version will be indicated by an updated &quot;Last
                  updated&quot; date at the top of this Privacy Policy. If we make material changes to this Privacy Policy, we may notify
                  you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you
                  to review this Privacy Policy frequently to be informed of how we are protecting your information.
                </p>
              </div>

              {/* 11. HOW CAN YOU CONTACT US ABOUT THIS POLICY? */}
              <div id="section-11" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-7">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Mail className="text-blue-600 shrink-0" size={22} />
                    11. How Can You Contact Us About This Policy?
                  </h2>
                  <p className="mb-3">If you have questions or comments about this policy, you may contact us at:</p>
                  <div className="space-y-1.5 text-slate-800 text-sm sm:text-base">
                    <p className="font-semibold text-slate-900">Ahsan Ali, trading as BizPrimeHub</p>
                    <p>
                      Email:{' '}
                      <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                        info@bizprimehub.com
                      </a>
                    </p>
                    <p>Multan, Punjab 60000, Pakistan</p>
                  </div>
                </div>
              </div>

              {/* 12. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU? */}
              <div id="section-12" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Edit className="text-blue-600 shrink-0" size={22} />
                  12. How Can You Review, Update, or Delete the Data We Collect From You?
                </h2>
                <p>
                  Based on the applicable laws of your country, you may have the right to request access to the personal information
                  we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal
                  information. You may also have the right to withdraw your consent to our processing of your personal information.
                  These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your
                  personal information, please log in to your account settings or submit a request through our contact form at{' '}
                  <Link href="/contact" className="text-blue-600 hover:underline font-medium">
                    https://www.bizprimehub.com/contact
                  </Link>
                  , or email us at{' '}
                  <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                    info@bizprimehub.com
                  </a>
                  .
                </p>
              </div>

              {/* 13. PUBLIC BUSINESS LISTINGS */}
              <div id="section-13" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-6 sm:p-7">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="text-amber-700 shrink-0" size={22} />
                    13. Public Business Listings
                  </h2>
                  <p className="text-slate-800 leading-relaxed">
                    Information you submit as part of a business listing (such as business name, contact details, address, photos, and
                    opening hours) is displayed publicly on BizPrimeHub so customers can find and contact the business. Please do not
                    include personal information in a listing unless you want it to be publicly visible.
                  </p>
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

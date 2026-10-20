import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  Scale,
  CheckCircle2,
  FileText,
  AlertOctagon,
  ShieldAlert,
  Globe,
  CreditCard,
  Lock,
  Eye,
  BookOpen,
  HelpCircle,
  UserCheck,
  ShieldCheck,
  Gavel,
  RefreshCw,
  Mail,
  ExternalLink,
} from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions | BizPrimeHub',
  description:
    'Terms and Conditions governing the use of BizPrimeHub online business directory, covering user accounts, business listings, listing fees, content moderation, reviews, and legal policies.',
  alternates: {
    canonical: 'https://www.bizprimehub.com/terms',
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
              Terms and Conditions
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
                  These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement
                  between you (whether as an individual visitor or an authorized representative of a business)
                  and <strong>Ahsan Ali, trading as BizPrimeHub</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
                  regarding your use of{' '}
                  <a href="https://www.bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                    https://www.bizprimehub.com
                  </a>{' '}
                  (the &quot;Services&quot;).
                </p>
                <p>
                  By accessing, browsing, registering on, or submitting content to the Services, you signify
                  your agreement to these Terms. If you do not agree with any part of these Terms, you must
                  discontinue using the Services immediately.
                </p>
              </div>

              {/* Table of Contents */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-7">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" /> Table of Contents
                </h2>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-700">
                  <li><a href="#section-1" className="hover:text-blue-600 transition-colors">1. Nature of the Service</a></li>
                  <li><a href="#section-2" className="hover:text-blue-600 transition-colors">2. Eligibility</a></li>
                  <li><a href="#section-3" className="hover:text-blue-600 transition-colors">3. User Accounts</a></li>
                  <li><a href="#section-4" className="hover:text-blue-600 transition-colors">4. Business Listings</a></li>
                  <li><a href="#section-5" className="hover:text-blue-600 transition-colors">5. Listing Accuracy</a></li>
                  <li><a href="#section-6" className="hover:text-blue-600 transition-colors">6. Reviews and Ratings</a></li>
                  <li><a href="#section-7" className="hover:text-blue-600 transition-colors">7. Prohibited Content and Conduct</a></li>
                  <li><a href="#section-8" className="hover:text-blue-600 transition-colors">8. Content Moderation</a></li>
                  <li><a href="#section-9" className="hover:text-blue-600 transition-colors">9. Payments and Listing Fees</a></li>
                  <li><a href="#section-10" className="hover:text-blue-600 transition-colors">10. Privacy and Data Protection</a></li>
                  <li><a href="#section-11" className="hover:text-blue-600 transition-colors">11. Cookies</a></li>
                  <li><a href="#section-12" className="hover:text-blue-600 transition-colors">12. Intellectual Property</a></li>
                  <li><a href="#section-13" className="hover:text-blue-600 transition-colors">13. Third-Party Businesses &amp; Links</a></li>
                  <li><a href="#section-14" className="hover:text-blue-600 transition-colors">14. Disclaimer of Warranties</a></li>
                  <li><a href="#section-15" className="hover:text-blue-600 transition-colors">15. Limitation of Liability</a></li>
                  <li><a href="#section-16" className="hover:text-blue-600 transition-colors">16. Governing Law</a></li>
                  <li><a href="#section-17" className="hover:text-blue-600 transition-colors">17. Changes to These Terms</a></li>
                  <li><a href="#section-18" className="hover:text-blue-600 transition-colors">18. Contact Us</a></li>
                </ol>
              </div>

              {/* 1. NATURE OF THE SERVICE — DIRECTORY, NOT A MARKETPLACE */}
              <div id="section-1" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="text-blue-600 shrink-0" size={22} />
                  1. Nature of the Service — Directory, Not a Marketplace
                </h2>
                <div className="space-y-3">
                  <p>
                    BizPrimeHub is an informational online directory for discovering local businesses in
                    Pakistan, the United Arab Emirates, and the United States. We list and index businesses
                    so customers can find and contact them.
                  </p>
                  <p>
                    BizPrimeHub is not a marketplace. We do not manufacture, sell, guarantee, or deliver any
                    goods or services listed by independent businesses. Any commercial transactions,
                    appointments, payments, bookings, or disputes arising between consumers and listed
                    businesses remain strictly between those parties. We are not a party to such transactions
                    and accept no responsibility for them.
                  </p>
                  <p>
                    Browsing and searching the directory is free. Publishing a business listing may require a
                    listing fee as described in Section 9.
                  </p>
                </div>
              </div>

              {/* 2. ELIGIBILITY */}
              <div id="section-2" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <UserCheck className="text-blue-600 shrink-0" size={22} />
                  2. Eligibility
                </h2>
                <p>
                  You must be at least 18 years old to register an account or submit a business listing on
                  BizPrimeHub. By using the Services, you represent that you are at least 18 years of age.
                </p>
              </div>

              {/* 3. USER ACCOUNTS */}
              <div id="section-3" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="text-blue-600 shrink-0" size={22} />
                  3. User Accounts
                </h2>
                <div className="space-y-3">
                  <p>
                    To submit listings or post reviews, you must register an account with your name, email
                    address, and password, and verify your email address through the one-time passcode (OTP)
                    we send you. Accounts with unverified email addresses cannot log in or submit content.
                  </p>
                  <p>
                    You are responsible for maintaining the confidentiality of your password and for all
                    activity under your account. Notify us immediately at{' '}
                    <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                      info@bizprimehub.com
                    </a>{' '}
                    if you suspect unauthorized access.
                  </p>
                  <p>
                    You may request deletion of your account at any time by contacting us. Deleting your
                    account also deletes your listings, reviews, and uploaded images. We may suspend or
                    terminate accounts that violate these Terms, without prior notice.
                  </p>
                </div>
              </div>

              {/* 4. BUSINESS LISTINGS */}
              <div id="section-4" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-blue-600 shrink-0" size={22} />
                  4. Business Listings
                </h2>
                <p>When submitting a business for inclusion on BizPrimeHub, you represent and warrant that:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>You are the business owner, managing partner, or an authorized representative of the business.</li>
                  <li>
                    All information you provide — business name, category, contact details, address, hours,
                    photos, and descriptions — is accurate, up-to-date, and non-deceptive.
                  </li>
                  <li>
                    You own or have the right to use all photos and content you upload, and they do not
                    infringe any third party&apos;s intellectual property rights.
                  </li>
                  <li>
                    You will promptly update your listing or request changes if your location, contact
                    details, or operating status changes.
                  </li>
                </ul>
                <p className="mt-3">
                  Listings are reviewed by our team before publication. We may reject or remove any listing at
                  our discretion.
                </p>
                <p className="mt-3 text-sm text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                  <strong>Verification Badges:</strong> Verification badges, where shown, reflect our internal
                  checks only. A verification badge is not an endorsement, warranty, or guarantee of the
                  business&apos;s products, services, or conduct.
                </p>
              </div>

              {/* 5. LISTING ACCURACY */}
              <div id="section-5" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="text-blue-600 shrink-0" size={22} />
                  5. Listing Accuracy
                </h2>
                <div className="space-y-3">
                  <p>
                    All listing details are provided by business owners. While we review submissions, we do
                    not independently verify every detail. Consumers should verify critical information (such
                    as prices, availability, and credentials) directly with the business before relying on it.
                  </p>
                  <p>
                    If you are the authorized representative of a listed business and wish to update, claim, or
                    remove your listing, contact us at{' '}
                    <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                      info@bizprimehub.com
                    </a>{' '}
                    with proof of ownership. Requests are typically processed within 3 to 5 business days.
                  </p>
                </div>
              </div>

              {/* 6. REVIEWS AND RATINGS */}
              <div id="section-6" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Eye className="text-blue-600 shrink-0" size={22} />
                  6. Reviews and Ratings
                </h2>
                <p>Reviews must reflect genuine customer experiences. The following are strictly prohibited and will be removed:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>False, fake, or misleading reviews.</li>
                  <li>Paid reviews or reviews exchanged for incentives.</li>
                  <li>Spam, repetitive, or off-topic reviews.</li>
                  <li>Reviews posted by a business on its own listing.</li>
                </ul>
                <p className="mt-3">
                  We may remove any review at our discretion. Businesses may respond to reviews factually and
                  professionally.
                </p>
              </div>

              {/* 7. PROHIBITED CONTENT AND CONDUCT */}
              <div id="section-7" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertOctagon className="text-red-600 shrink-0" size={22} />
                  7. Prohibited Content and Conduct
                </h2>
                <p>You must not submit, upload, or share content that:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3 text-slate-600">
                  <li>Is unlawful, fraudulent, or deceptive.</li>
                  <li>Promotes unlawful activities, contraband, or unlicensed weapons.</li>
                  <li>Infringes trademark, copyright, or other intellectual property rights.</li>
                  <li>Contains malware, scraping bots, or spam links.</li>
                  <li>Harasses, threatens, or defames any person or business.</li>
                  <li>
                    Violates the Prevention of Electronic Crimes Act (PECA 2016) or any other applicable law.
                  </li>
                </ul>
                <p className="mt-3">
                  You must not attempt to gain unauthorized access to the Services, disrupt its operation, or
                  scrape its content through automated means without our written permission.
                </p>
              </div>

              {/* 8. CONTENT MODERATION */}
              <div id="section-8" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600 shrink-0" size={22} />
                  8. Content Moderation
                </h2>
                <p>
                  We reserve the right, in our sole discretion, to review, edit, reject, suspend, or
                  permanently remove any listing, review, image, or account that violates these Terms or that we
                  consider inappropriate, without prior notice and without liability.
                </p>
              </div>

              {/* 9. PAYMENTS AND LISTING FEES */}
              <div id="section-9" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard className="text-blue-600 shrink-0" size={22} />
                  9. Payments and Listing Fees
                </h2>
                <ul className="list-disc pl-6 space-y-2.5 text-slate-600">
                  <li>
                    Publishing a business listing may require a one-time listing fee, depending on your
                    country. The exact fee for your region is always shown before you submit your listing.
                  </li>
                  <li>
                    BizPrimeHub does not process payments on this website. You pay directly through your own
                    bank app or wallet — via JazzCash, bank transfer, or Raast QR — using the payment
                    details displayed during listing submission.
                  </li>
                  <li>
                    After paying, upload a screenshot of your payment receipt. Your listing will be reviewed
                    and published once your payment is verified by our team.
                  </li>
                  <li>
                    Listing fees are non-refundable once your listing has been published, except where
                    required by applicable law.
                  </li>
                  <li>
                    We never ask for, see, or store your card numbers, PINs, passwords, or bank login
                    details. Never share such information with anyone claiming to represent BizPrimeHub.
                  </li>
                </ul>
              </div>

              {/* 10. PRIVACY AND DATA PROTECTION */}
              <div id="section-10" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Lock className="text-blue-600 shrink-0" size={22} />
                  10. Privacy and Data Protection
                </h2>
                <div className="space-y-3">
                  <p>
                    Your privacy matters to us. Our Privacy Policy, available at{' '}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline font-medium">
                      https://www.bizprimehub.com/privacy-policy
                    </Link>
                    , forms part of these Terms and explains what personal information we collect, how we use
                    it, and your rights. By using the Services, you consent to the data practices described in
                    the Privacy Policy.
                  </p>
                  <p className="font-semibold text-slate-900">Key points you should know:</p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600">
                    <li>
                      Information you include in a business listing (name, contact details, address, photos,
                      hours) is displayed publicly on the directory. Do not include personal information in a
                      listing unless you want it to be publicly visible.
                    </li>
                    <li>
                      We collect account information (name, email, password), content you submit (listings,
                      reviews, photos, receipt images), and technical data (such as IP addresses for security
                      purposes).
                    </li>
                    <li>
                      You may request access to, correction of, or deletion of your personal information at any
                      time via{' '}
                      <Link href="/contact" className="text-blue-600 hover:underline">
                        https://www.bizprimehub.com/contact
                      </Link>{' '}
                      or{' '}
                      <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline">
                        info@bizprimehub.com
                      </a>
                      .
                    </li>
                    <li>We do not sell your personal information.</li>
                  </ul>
                </div>
              </div>

              {/* 11. COOKIES */}
              <div id="section-11" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="text-blue-600 shrink-0" size={22} />
                  11. Cookies
                </h2>
                <p>
                  We use cookies to keep you logged in and to operate basic site functions, and Google Maps may
                  set its own cookies when maps are displayed. A dedicated Cookie Policy will be published on
                  the Services. By using the Services, you consent to our use of cookies as described in our
                  Privacy Policy.
                </p>
              </div>

              {/* 12. INTELLECTUAL PROPERTY */}
              <div id="section-12" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Scale className="text-blue-600 shrink-0" size={22} />
                  12. Intellectual Property
                </h2>
                <div className="space-y-3">
                  <p>
                    The Services, including their design, text, graphics, and software, are owned by us and
                    protected by intellectual property laws. You may not copy, reproduce, or redistribute our
                    content without written permission.
                  </p>
                  <p>
                    By submitting content (listings, reviews, photos), you grant us a worldwide,
                    non-exclusive, royalty-free license to display, reproduce, and distribute that content on
                    the Services for the purpose of operating the directory. You retain ownership of your
                    content.
                  </p>
                </div>
              </div>

              {/* 13. THIRD-PARTY BUSINESSES AND LINKS */}
              <div id="section-13" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="text-blue-600 shrink-0" size={22} />
                  13. Third-Party Businesses and Links
                </h2>
                <p>
                  The Services contain information about independent third-party businesses and may contain
                  links to external websites. We do not control, endorse, or assume responsibility for any
                  third-party business, website, or content. Your dealings with listed businesses are solely
                  between you and the business.
                </p>
              </div>

              {/* 14. DISCLAIMER OF WARRANTIES */}
              <div id="section-14" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldAlert className="text-amber-600 shrink-0" size={22} />
                  14. Disclaimer of Warranties
                </h2>
                <p>
                  The Services are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without
                  warranties of any kind, whether express or implied. To the fullest extent permitted by
                  applicable law, we do not warrant uninterrupted availability, error-free operation, or the
                  completeness, accuracy, or reliability of any listing or content.
                </p>
              </div>

              {/* 15. LIMITATION OF LIABILITY */}
              <div id="section-15" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <AlertOctagon className="text-red-600 shrink-0" size={22} />
                  15. Limitation of Liability
                </h2>
                <p>
                  To the fullest extent permitted by applicable law, BizPrimeHub and its operator shall not be
                  liable for any indirect, incidental, special, consequential, or punitive damages arising from
                  your use of the Services, your dealings with listed businesses, or your reliance on any
                  listing content. Our total liability for any claim shall not exceed the amount you paid us,
                  if any, in the 12 months preceding the claim.
                </p>
              </div>

              {/* 16. GOVERNING LAW */}
              <div id="section-16" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Gavel className="text-blue-600 shrink-0" size={22} />
                  16. Governing Law
                </h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of Pakistan, including
                  the Prevention of Electronic Crimes Act (PECA 2016). Any disputes shall be subject to the
                  jurisdiction of the courts of Pakistan.
                </p>
              </div>

              {/* 17. CHANGES TO THESE TERMS */}
              <div id="section-17" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="text-blue-600 shrink-0" size={22} />
                  17. Changes to These Terms
                </h2>
                <p>
                  We may update these Terms from time to time. The updated version will be indicated by the
                  &quot;Last updated&quot; date at the top. Material changes will be announced by a notice on the
                  Services. Your continued use of the Services after changes take effect constitutes your
                  acceptance of the revised Terms.
                </p>
              </div>

              {/* 18. CONTACT US */}
              <div id="section-18" className="border-t border-slate-100 pt-8 scroll-mt-20">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-7">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Mail className="text-blue-600 shrink-0" size={22} />
                    18. Contact Us
                  </h2>
                  <div className="space-y-2 text-slate-800 text-sm sm:text-base">
                    <p className="font-semibold text-slate-900">Ahsan Ali, trading as BizPrimeHub</p>
                    <p>
                      Email:{' '}
                      <a href="mailto:info@bizprimehub.com" className="text-blue-600 hover:underline font-medium">
                        info@bizprimehub.com
                      </a>
                    </p>
                    <p>Multan, Punjab 60000, Pakistan</p>
                    <p>
                      Contact form:{' '}
                      <Link href="/contact" className="text-blue-600 hover:underline font-medium">
                        https://www.bizprimehub.com/contact
                      </Link>
                    </p>
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

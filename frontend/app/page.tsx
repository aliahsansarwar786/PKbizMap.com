import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import { safeJsonLd } from '@/lib/safeJsonLd';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/components/home/HeroSearch';

const BrowseSection = dynamic(() => import('@/components/business/BrowseSection'), {
  ssr: true,
  loading: () => <div className="py-12 text-center text-slate-400">Loading directory...</div>,
});

const RecentlyListed = dynamic(() => import('@/components/business/RecentlyListed'), {
  ssr: true,
  loading: () => null,
});

const FaqSection = dynamic(() => import('@/components/home/FaqSection'));
import {
  Search,
  ArrowRight,
  Monitor,
  Home,
  UtensilsCrossed,
  Heart,
  GraduationCap,
  Car,
  ShoppingBag,
  DollarSign,
  Scissors,
  Plane,
  Briefcase,
  HardHat,
  LayoutGrid,
  CheckCircle2,
  Star,
  Users,
  TrendingUp,
} from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { getCategorySlug, getCountrySlug, getCitySlug } from '@/lib/slugify';
import { fetchBusinessSummary } from '@/lib/landingData';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search & Discover',
    description: 'Browse local businesses by category, location, or keyword.',
    color: '#2563eb',
  },
  {
    step: '02',
    title: 'Get Details',
    description: 'Find essential details, contact information, and operating hours for local businesses.',
    color: '#059669',
  },
  {
    step: '03',
    title: 'Connect & Grow',
    description: 'Contact businesses directly or list your own business to reach more customers.',
    color: '#d97706',
  },
];

const STATS = [
  { label: 'Businesses Listed', value: '10,000+', icon: LayoutGrid },
  { label: 'Happy Customers', value: '50,000+', icon: Users },
  { label: 'Reviews Posted', value: '100,000+', icon: Star },
  { label: 'Categories', value: '13', icon: TrendingUp },
];

export const metadata: Metadata = {
  title: {
    absolute: 'Free Business Directory Pakistan, UAE & USA | BizPrimeHub',
  },
  description:
    'List your business free on BizPrimeHub — Pakistan, UAE & USA trusted local business directory. Find shops, hotels, restaurants and services near you.',
  keywords:
    'free business listing, business directory Pakistan, list your business free, local businesses near me, Pakistan business directory, free listing site, add your business, trusted local businesses, businesses in Multan, find businesses in Pakistan',
  alternates: {
    canonical: 'https://www.bizprimehub.com',
  },
  openGraph: {
    title: 'Free Business Directory Pakistan, UAE & USA | BizPrimeHub',
    description:
      'List your business free on BizPrimeHub — Pakistan, UAE & USA trusted local business directory. Find shops, hotels, restaurants and services near you.',
    url: 'https://www.bizprimehub.com',
    siteName: 'BizPrimeHub',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Free Business Listing & Local Business Directory in Pakistan, UAE & USA | BizPrimeHub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Business Directory Pakistan, UAE & USA | BizPrimeHub',
    description:
      'List your business free on BizPrimeHub — Pakistan, UAE & USA trusted local business directory. Find shops, hotels, restaurants and services near you.',
    images: ['/og-default.jpg'],
  },
};

async function fetchRecentBusinesses(): Promise<any[]> {
  const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
  const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';

  try {
    const res = await fetch(`${primaryApi}/businesses?limit=8&sort=-createdAt`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.businesses && Array.isArray(json.data.businesses)) {
        return json.data.businesses;
      }
    }
  } catch (err) {
    // try fallback
  }

  if (primaryApi !== fallbackApi) {
    try {
      const fbRes = await fetch(`${fallbackApi}/businesses?limit=8&sort=-createdAt`, {
        next: { revalidate: 3600 },
      });
      if (fbRes.ok) {
        const json = await fbRes.json();
        if (json?.data?.businesses && Array.isArray(json.data.businesses)) {
          return json.data.businesses;
        }
      }
    } catch (fbErr) {
      // ignore
    }
  }

  return [];
}

export default async function HomePage() {
  const [summary, recentBusinesses] = await Promise.all([
    fetchBusinessSummary(),
    fetchRecentBusinesses(),
  ]);

  const topCities: { city: string; country: string; count: number; citySlug: string; countrySlug: string }[] = [];
  if (summary?.cities) {
    for (const [countryName, cityMap] of Object.entries(summary.cities)) {
      if (!cityMap) continue;
      for (const [cityName, count] of Object.entries(cityMap)) {
        if (count > 0) {
          topCities.push({
            city: cityName,
            country: countryName,
            count,
            citySlug: getCitySlug(cityName, countryName as any),
            countrySlug: getCountrySlug(countryName),
          });
        }
      }
    }
  }
  topCities.sort((a, b) => b.count - a.count);
  const top12Cities = topCities.slice(0, 12);

  let businessCount = 0;
  try {
    const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
    const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';
    let res = await fetch(`${primaryApi}/businesses?limit=1`, { next: { revalidate: 60 } }).catch(() => null);
    if (!res || !res.ok) {
      if (primaryApi !== fallbackApi) {
        res = await fetch(`${fallbackApi}/businesses?limit=1`, { next: { revalidate: 60 } }).catch(() => null);
      }
    }
    if (res && res.ok) {
      const resData = await res.json();
      businessCount = resData.data?.pagination?.totalResults || 0;
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }

  const DYNAMIC_STATS = [
    { label: 'Businesses Listed', value: businessCount, icon: LayoutGrid },
    { label: 'Categories', value: CATEGORIES.length, icon: TrendingUp },
    { label: 'Platform Access', value: 'Free', icon: Users },
    { label: 'Community', value: 'Growing', icon: Star },
  ];

  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'BizPrimeHub',
      url: 'https://www.bizprimehub.com',
      logo: 'https://www.bizprimehub.com/logo-transparent.png',
      description: 'Free business listing and local business directory for Pakistan, UAE and the USA.',
      slogan: 'List Your Business for Free',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+92-310-6131361',
          contactType: 'customer service',
          email: 'info@bizprimehub.com',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'BizPrimeHub',
      url: 'https://www.bizprimehub.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.bizprimehub.com/businesses?keyword={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(homeJsonLd) }}
      />
      <Navbar />
      <main>
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <section
          className="relative w-full overflow-hidden flex flex-col lg:block bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]"
          aria-labelledby="hero-heading"
        >
          {/* Desktop Background Image (Hidden on mobile/tablet) */}
          <div 
            className="hidden lg:block absolute inset-0 w-full h-full"
            style={{
              backgroundImage: 'url("/hero-bg.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat'
            }}
          ></div>
          
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 sm:pt-24 lg:pt-32 pb-6 lg:pb-32">
            <div className="w-full lg:w-[60%] lg:pr-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 shadow-sm bg-white/70 backdrop-blur-sm border border-blue-200"
              >
                <CheckCircle2 size={14} className="text-blue-600" />
                <span className="text-[0.8125rem] font-semibold text-blue-900">
                  Join our growing local business community
                </span>
              </div>

              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-[4rem] font-extrabold text-slate-900 mb-5 leading-[1.1] tracking-tight"
              >
                Find Trusted Local Businesses in Pakistan, the UAE &amp; the USA
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 mb-8 leading-relaxed font-medium max-w-xl">
                The free business listing directory for Pakistan, the UAE and the USA — list your business for free and get found by customers near you.
              </p>
            </div>
          </div>
          
          {/* Mobile Image (Visible only on mobile/tablet, shown below text) */}
          <div className="w-full lg:hidden relative -mt-4">
             <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#e0f2fe] to-transparent z-10"></div>
             <Image
               src="/hero-bg.jpg"
               alt="Pakistan Business Map"
               width={1376}
               height={768}
               priority
               sizes="(max-width: 1024px) 100vw, 1376px"
               className="w-full h-auto object-cover object-right"
             />
          </div>
        </section>

        {/* ── Elevated Search Section ──────────────────────────────────────────────── */}
        <section className="relative z-20 -mt-16 max-w-5xl mx-auto px-4 mb-16">
          <HeroSearch categories={CATEGORIES.map(c => ({ name: c.name })) as any} />
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section style={{ background: '#ffffff', borderBottom: '1px solid #f3f4f6', padding: '2rem 0' }}>
          <div className="container-max">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {DYNAMIC_STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: '#eff6ff' }}
                  >
                    <Icon size={20} style={{ color: '#2563eb' }} />
                  </div>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{value}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Browse Directory Section (Country, City & Category Cards with Images) ─── */}
        <section className="section bg-slate-50/70" aria-labelledby="browse-directory-heading">
          <div className="container-max">
            <div
              style={{
                textAlign: 'center',
                maxWidth: '44rem',
                margin: '0 auto 2.5rem auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <h2
                id="browse-directory-heading"
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.025em',
                  marginBottom: '0.625rem',
                  textAlign: 'center',
                }}
              >
                Browse Businesses by Location & Category
              </h2>
              <p
                style={{
                  fontSize: '0.975rem',
                  color: '#64748b',
                  textAlign: 'center',
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}
              >
                Select a country below to explore local cities and discover verified businesses across top industries.
              </p>
            </div>

            <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading directory...</div>}>
              <BrowseSection isHomePage={true} />
            </Suspense>
          </div>
        </section>

        {/* ── Recently Listed Section ─────────────────────────────────────── */}
        <Suspense fallback={null}>
          <RecentlyListed />
        </Suspense>

        {/* ── Directory Links (Server-Rendered for Crawlers & Fast Navigation) ── */}
        <section
          className="section"
          style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}
          aria-labelledby="directory-links-heading"
        >
          <div className="container-max">
            <div className="text-center mb-10">
              <h2
                id="directory-links-heading"
                style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}
              >
                Explore BizPrimeHub Directory
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                Browse verified local listings by industry category, popular locations, and recently approved businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Group 1: Browse by Category */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Browse by Category</span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {CATEGORIES.length} Categories
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/categories/${getCategorySlug(cat.name)}`}
                      className="text-xs sm:text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 px-2.5 py-1.5 rounded-lg transition-colors truncate"
                      title={cat.name}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Group 2: Browse by Country & City */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Browse by Country &amp; City
                </h3>
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Countries</div>
                  <div className="flex flex-wrap gap-2">
                    {['Pakistan', 'UAE', 'USA'].map((country) => (
                      <Link
                        key={country}
                        href={`/cities/${getCountrySlug(country)}`}
                        className="inline-flex items-center text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {country}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Popular Cities</div>
                  <div className="grid grid-cols-2 gap-2">
                    {top12Cities.map((c) => (
                      <Link
                        key={`${c.countrySlug}-${c.citySlug}`}
                        href={`/cities/${c.countrySlug}/${c.citySlug}`}
                        className="text-xs sm:text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 px-2.5 py-1.5 rounded-lg transition-colors truncate"
                        title={`${c.city}, ${c.country}`}
                      >
                        {c.city}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group 3: Recently Listed */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Recently Listed</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Latest
                  </span>
                </h3>
                <ul className="space-y-2">
                  {recentBusinesses.map((b: any) => (
                    <li key={b._id || b.slug}>
                      <Link
                        href={`/businesses/${b.slug || b._id}`}
                        className="text-xs sm:text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 px-2.5 py-1.5 rounded-lg transition-colors block truncate"
                        title={b.title}
                      >
                        {b.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <section className="section" style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9' }} aria-labelledby="how-heading">
          <div className="container-max">
            <div className="text-center mb-10">
              <h2 id="how-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                How It Works
              </h2>
              <p style={{ color: '#6b7280' }}>Get started in just a few simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map(({ step, title, description, color }) => (
                <div key={step} className="card p-6 text-center">
                  <div
                    className="text-3xl font-bold mb-4"
                    style={{ color }}
                  >
                    {step}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Choose Us ────────────────────────────────────────────────── */}
        <section className="section" style={{ background: '#ffffff', borderTop: '1px solid #f3f4f6' }} aria-labelledby="why-heading">
          <div className="container-max">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 id="why-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                  Why Businesses & Customers Choose Us
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: 1.7 }}>
                  Our platform connects people with local businesses across the community. We aim to ensure a seamless experience for everyone.
                </p>
                
                <div className="space-y-6">
                  {[
                    { title: 'Business Listings', desc: 'Find local businesses across Pakistan, the UAE and the USA.' },
                    { title: 'Community Feedback', desc: 'A growing platform to help you make informed decisions before any purchasing decisions.' },
                    { title: 'Advanced Search', desc: 'Find exactly what you need with our powerful location and category-based search engine.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>{item.title}</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden" style={{ background: '#f3f4f6' }}>
                <Image 
                  src="/images/homepage-hero.jpg" 
                  alt="Business meeting" 
                  width={800}
                  height={450}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ("Got Questions?") ──────────────────────────────── */}
        <FaqSection />

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section
          style={{ background: '#2563eb', padding: '4rem 0' }}
          aria-labelledby="cta-heading"
        >
          <div className="container-max text-center">
            <h2 id="cta-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
              Own a Business? List It for Free!
            </h2>
            <p style={{ color: '#eff6ff', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7 }}>
              Reach potential customers in your community. Create your business listing today — it's completely free to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                style={{ background: '#ffffff', color: '#2563eb', fontSize: '0.9375rem' }}
              >
                Get Started Free <ArrowRight size={16} />
              </Link>
              <Link
                href="/businesses"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                style={{ background: 'transparent', color: '#ffffff', border: '2px solid rgba(255,255,255,0.5)', fontSize: '0.9375rem' }}
              >
                Browse Directory
              </Link>
            </div>
          </div>
        </section>

        {/* ── SEO Overview / About Section ────────────────────────────────── */}
        <section className="py-12 bg-white border-t border-slate-100">
          <div className="container-max">
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-4xl mx-auto text-center">
              BizPrimeHub is a free business listing directory where local businesses in Pakistan, the UAE and the USA can list their business for free and get found by customers searching online. Browse trusted shops, hotels, restaurants, clinics, salons and services near you — or add your own business listing today and grow with BizPrimeHub.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

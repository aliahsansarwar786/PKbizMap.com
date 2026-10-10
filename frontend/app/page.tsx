import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomeFeatured from '@/components/business/HomeFeatured';
import TopListingsMarquee from '@/components/business/TopListingsMarquee';
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

const CATEGORIES = [
  { name: 'IT', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80' },
  { name: 'Real Estate', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80' },
  { name: 'Restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80' },
  { name: 'Healthcare', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80' },
  { name: 'Education', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80' },
  { name: 'Automotive', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80' },
  { name: 'Retail', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80' },
  { name: 'Finance', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80' },
  { name: 'Beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80' },
  { name: 'Travel', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80' },
  { name: 'Professional Services', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80' },
  { name: 'Construction', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80' },
];

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

export const metadata = {
  title: 'BizPrimeHub - Find Trusted Local Businesses Near You',
  description:
    'Discover and connect with local businesses. Browse by category and find services in your area.',
};

export default async function HomePage() {
  let businessCount = 0;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api'}/businesses?limit=1`, { next: { revalidate: 60 } });
    if (res.ok) {
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

  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <section
          className="relative w-full overflow-hidden flex flex-col justify-center pb-20 pt-24 sm:pt-32 sm:pb-28"
          style={{
            backgroundImage: 'url("/hero-bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
          aria-labelledby="hero-heading"
        >
          <div className="absolute inset-0 bg-white/30 z-0"></div>
          
          <div className="container-max text-left relative z-10 md:w-1/2 md:mr-auto">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 shadow-sm"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(37,99,235,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <CheckCircle2 size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e3a8a' }}>
                Join our growing local business community
              </span>
            </div>

            <h1
              id="hero-heading"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}
            >
              Find Your Best<br />
              <span style={{ color: '#2563eb' }}>Business</span> Today
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                color: '#334155',
                maxWidth: 600,
                margin: '0 0 2.5rem',
                lineHeight: 1.7,
                fontWeight: 500
              }}
            >
              Discover, compare, and connect with local businesses across Pakistan. Find
              the best services for every need.
            </p>
          </div>
        </section>

        {/* ── Elevated Search Section ──────────────────────────────────────────────── */}
        <section className="relative z-20 -mt-16 max-w-5xl mx-auto px-4 mb-16">
          <div className="rounded-2xl border border-gray-100 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-gray-900 mb-5 text-center sm:text-left">
              Search Local Businesses
            </h2>
            <form
              action="/businesses"
              method="GET"
              className="w-full flex flex-col md:flex-row gap-3"
              aria-label="Business search form"
            >
              <div className="flex-1 relative">
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  name="keyword"
                  placeholder="What are you looking for?"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <div className="md:w-48 relative">
                <select 
                  name="city"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="">All Cities</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                </select>
              </div>

              <div className="md:w-56 relative">
                <select 
                  name="category"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-md md:w-32 flex-shrink-0 flex items-center justify-center gap-2"
              >
                Search
              </button>
            </form>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
              Popular: &nbsp;
              {['Restaurant', 'IT', 'Healthcare', 'Real Estate'].map((cat, i) => (
                <span key={cat}>
                  <Link
                    href={`/businesses?category=${encodeURIComponent(cat)}`}
                    style={{ color: '#2563eb', fontWeight: 500 }}
                    className="hover:underline"
                  >
                    {cat}
                  </Link>
                  {i < 3 && <span> &middot; </span>}
                </span>
              ))}
            </p>
          </div>
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

        {/* ── Categories ─────────────────────────────────────────────────── */}
        <section className="section" style={{ background: '#f9fafb' }} aria-labelledby="categories-heading">
          <div className="container-max">
            <div className="text-center mb-10">
              <h2 id="categories-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                Browse by Category
              </h2>
              <p style={{ color: '#6b7280' }}>Find exactly what you need from our growing list of categories</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map(({ name, image }) => (
                <Link
                  key={name}
                  href={`/businesses?category=${encodeURIComponent(name)}`}
                  className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 shadow-sm">
                    <img
                      src={image}
                      alt={name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <span className="font-semibold text-slate-800 text-[15px] group-hover:text-blue-600 transition-colors">
                    {name}
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/categories" className="btn-secondary">
                View All Categories <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Top Listings Marquee ────────────────────────────────────────── */}
        <TopListingsMarquee />

        {/* ── Featured Businesses ─────────────────────────────────────────── */}
        <section className="section" aria-labelledby="featured-heading">
          <div className="container-max">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 id="featured-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                  Featured Businesses
                </h2>
                <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Handpicked and approved businesses</p>
              </div>
              <Link href="/businesses" className="btn-secondary hidden sm:flex">
                View All <ArrowRight size={15} />
              </Link>
            </div>

            <HomeFeatured />

            <div className="text-center mt-8 sm:hidden">
              <Link href="/businesses" className="btn-secondary">
                View All Businesses <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────────── */}
        <section className="section" style={{ background: '#f9fafb' }} aria-labelledby="how-heading">
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
                    { title: 'Business Listings', desc: 'Find local businesses across Pakistan.' },
                    { title: 'Community Feedback', desc: 'A growing platform to help you make informed decisions before any purchasing decisions.' },
                    { title: 'Advanced Search', desc: 'Find exactly what you need with our powerful location and category-based search engine.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>{item.title}</h4>
                        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden" style={{ background: '#f3f4f6' }}>
                <img 
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Business meeting" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Newsletter ──────────────────────────────────────────────────── */}
        <section className="section" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }} aria-labelledby="newsletter-heading">
          <div className="container-max max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
              <TrendingUp size={32} />
            </div>
            <h2 id="newsletter-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.75rem' }}>
              Stay Updated with Local Trends
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2.5rem', fontSize: '1.0625rem' }}>
              Subscribe to our newsletter to receive weekly updates on the best new businesses, exclusive offers, and local events.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="input-field flex-1"
                style={{ height: '3rem' }}
                required
              />
              <button 
                type="submit" 
                className="btn-primary"
                style={{ height: '3rem', padding: '0 2rem' }}
              >
                Subscribe
              </button>
            </form>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section
          style={{ background: '#2563eb', padding: '4rem 0' }}
          aria-labelledby="cta-heading"
        >
          <div className="container-max text-center">
            <h2 id="cta-heading" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
              Own a Business? List It for Free!
            </h2>
            <p style={{ color: '#bfdbfe', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7 }}>
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
      </main>
      <Footer />
    </>
  );
}

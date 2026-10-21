import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BlogClient from './BlogClient';
import { getAllPosts } from '@/data/blogPosts';
import { BookOpen, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Growth & Local SEO Blog',
  description: 'Expert business tips, marketing guides, Google Maps ranking tactics, and digital tools tailored for local shopkeepers and SMEs across Pakistan.',
  alternates: {
    canonical: 'https://www.bizprimehub.com/blog',
  },
  openGraph: {
    title: 'Business Growth & Local SEO Blog | BizPrimeHub',
    description: 'Expert business tips, marketing guides, Google Maps ranking tactics, and digital tools tailored for local shops across Pakistan.',
    url: 'https://www.bizprimehub.com/blog',
    siteName: 'BizPrimeHub',
    type: 'website',
    images: ['/og-default.jpg'],
  },
};

export const dynamic = 'force-dynamic';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-900 via-slate-900 to-[#0a0f1c] text-white py-16 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <Sparkles size={14} /> Knowledge & Strategy Hub
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              BizPrimeHub Business Insights
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Practical guides, local SEO strategies, and operational growth tactics designed specifically for Pakistani retail stores and modern service providers.
            </p>
          </div>
        </section>

        {/* Client-side Search, Filtering & Grid */}
        <BlogClient initialPosts={posts} />
      </main>
      <Footer />
    </>
  );
}

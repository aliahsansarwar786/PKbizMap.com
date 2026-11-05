import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessCard from '@/components/business/BusinessCard';
import { safeJsonLd } from '@/lib/safeJsonLd';
import {
  getCategoryBySlug,
  getCityBySlug,
  getCountrySlug,
} from '@/lib/slugify';
import {
  fetchBusinessSummary,
  fetchLandingBusinesses,
  formatTitle,
  formatDescription,
  getComboTotalCount,
} from '@/lib/landingData';

export const revalidate = 3600;

interface ComboPageProps {
  params: Promise<{ categorySlug: string; citySlug: string }>;
}

export async function generateMetadata({ params }: ComboPageProps): Promise<Metadata> {
  const { categorySlug, citySlug } = await params;
  const categoryName = getCategoryBySlug(categorySlug);
  const cityInfo = getCityBySlug(citySlug);
  if (!categoryName || !cityInfo) return {};

  const summary = await fetchBusinessSummary();
  const count = getComboTotalCount(summary, cityInfo.country, cityInfo.city, categoryName);
  if (count <= 0) return {};

  const { baseTitle, finalTitle } = formatTitle(
    `${categoryName} in ${cityInfo.city}, ${cityInfo.country}`,
    `${categoryName} in ${cityInfo.city}`,
    `${categoryName} in ${cityInfo.city}`
  );

  const prefix = count === 1
    ? `Find the verified ${categoryName} business in ${cityInfo.city}, ${cityInfo.country} on BizPrimeHub.`
    : `Find verified ${categoryName} businesses in ${cityInfo.city}, ${cityInfo.country} on BizPrimeHub.`;
  const description = formatDescription(prefix);
  const canonical = `https://www.bizprimehub.com/categories/${categorySlug}/${citySlug}`;

  return {
    title: baseTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: finalTitle,
      description,
      url: canonical,
      siteName: 'BizPrimeHub',
      type: 'website',
      images: [{ url: '/og-default.jpg', alt: finalTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description,
      images: [{ url: '/og-default.jpg', alt: finalTitle }],
    },
  };
}

export default async function CategoryCityComboPage({ params }: ComboPageProps) {
  const { categorySlug, citySlug } = await params;
  const categoryName = getCategoryBySlug(categorySlug);
  const cityInfo = getCityBySlug(citySlug);

  if (!categoryName || !cityInfo) {
    notFound();
  }

  const summary = await fetchBusinessSummary();
  const count = getComboTotalCount(summary, cityInfo.country, cityInfo.city, categoryName);
  if (count <= 0) {
    notFound();
  }

  const { businesses, totalResults } = await fetchLandingBusinesses({
    category: categoryName,
    city: cityInfo.city,
    country: cityInfo.country,
    limit: 12,
  });

  const countrySlug = getCountrySlug(cityInfo.country);
  const canonicalUrl = `https://www.bizprimehub.com/categories/${categorySlug}/${citySlug}`;
  const introPrefix = count === 1
    ? `Find the verified ${categoryName} business in ${cityInfo.city}, ${cityInfo.country} on BizPrimeHub.`
    : `Find verified ${categoryName} businesses in ${cityInfo.city}, ${cityInfo.country} on BizPrimeHub.`;
  const introParagraph = `${introPrefix} Find top-rated companies, contact numbers, addresses, and customer reviews.`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.bizprimehub.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: `https://www.bizprimehub.com/categories/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${categoryName} in ${cityInfo.city}`,
        item: canonicalUrl,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} in ${cityInfo.city}, ${cityInfo.country}`,
    numberOfItems: businesses.length,
    itemListElement: businesses.map((b, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: b.title,
      url: `https://www.bizprimehub.com/businesses/${b.slug || b._id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        {/* Header Banner */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href={`/categories/${categorySlug}`} className="hover:text-blue-600 transition-colors">
                {categoryName}
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{cityInfo.city}</span>
            </nav>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              {categoryName} in {cityInfo.city}, {cityInfo.country}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
              {introParagraph}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {count} {count === 1 ? 'Business' : 'Businesses'}
              </span>
              <Link
                href={`/cities/${countrySlug}/${citySlug}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                All Businesses in {cityInfo.city} &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Verified {categoryName} Listings in {cityInfo.city}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Top rated local {categoryName.toLowerCase()} services in {cityInfo.city}
              </p>
            </div>
            {totalResults > 12 && (
              <Link
                href={`/businesses?category=${encodeURIComponent(categoryName)}&city=${encodeURIComponent(cityInfo.city)}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all {totalResults} in {cityInfo.city}</span>
                <span>&rarr;</span>
              </Link>
            )}
          </div>

          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard key={business._id} business={business} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              No listings currently available for {categoryName} in {cityInfo.city}.
            </div>
          )}

          {totalResults > 12 && (
            <div className="mt-8 text-center sm:hidden">
              <Link
                href={`/businesses?category=${encodeURIComponent(categoryName)}&city=${encodeURIComponent(cityInfo.city)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all {totalResults} in {cityInfo.city}</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}

          {/* Quick links footer for combo page */}
          <section className="mt-14 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/categories/${categorySlug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>&larr; More {categoryName} Businesses in other cities</span>
            </Link>
            <Link
              href={`/cities/${countrySlug}/${citySlug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>Explore all other categories in {cityInfo.city} &rarr;</span>
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}


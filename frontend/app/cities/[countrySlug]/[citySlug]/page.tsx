import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessCard from '@/components/business/BusinessCard';
import { safeJsonLd } from '@/lib/safeJsonLd';
import {
  getCountryBySlug,
  getCountrySlug,
  getCityBySlug,
  getCategorySlug,
} from '@/lib/slugify';
import {
  fetchBusinessSummary,
  fetchLandingBusinesses,
  formatTitle,
  formatDescription,
  getCityTotalCount,
} from '@/lib/landingData';

export const revalidate = 3600;

interface CityPageProps {
  params: Promise<{ countrySlug: string; citySlug: string }>;
}

export async function generateStaticParams() {
  const summary = await fetchBusinessSummary();
  if (!summary?.cities) return [];

  const validParams: { countrySlug: string; citySlug: string }[] = [];
  for (const [country, cityMap] of Object.entries(summary.cities)) {
    if (!cityMap) continue;
    const countrySlug = getCountrySlug(country);
    for (const [cityName, cityCount] of Object.entries(cityMap)) {
      if (cityCount > 0) {
        const cityInfo = getCityBySlug(cityName) || getCityBySlug(cityName.toLowerCase());
        const citySlug = cityInfo?.slug || cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        validParams.push({ countrySlug, citySlug });
      }
    }
  }
  return validParams;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { countrySlug, citySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return {};

  const cityInfo = getCityBySlug(citySlug, country);
  if (!cityInfo) return {};

  const summary = await fetchBusinessSummary();
  const count = getCityTotalCount(summary, country, cityInfo.city);
  if (count <= 0) return {};

  const { baseTitle, finalTitle } = formatTitle(
    `Businesses in ${cityInfo.city}, ${country}`,
    `Businesses in ${cityInfo.city}`,
    `Businesses in ${cityInfo.city}`
  );

  const prefix = count === 1
    ? `Find the verified business in ${cityInfo.city}, ${country} on BizPrimeHub.`
    : `Find verified businesses in ${cityInfo.city}, ${country} on BizPrimeHub.`;
  const description = formatDescription(prefix);
  const canonical = `https://www.bizprimehub.com/cities/${countrySlug}/${citySlug}`;

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

export default async function CityLandingPage({ params }: CityPageProps) {
  const { countrySlug, citySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) {
    notFound();
  }

  const cityInfo = getCityBySlug(citySlug, country);
  if (!cityInfo) {
    notFound();
  }

  const summary = await fetchBusinessSummary();
  const count = getCityTotalCount(summary, country, cityInfo.city);
  if (count <= 0) {
    notFound();
  }

  const { businesses, totalResults } = await fetchLandingBusinesses({
    country,
    city: cityInfo.city,
    limit: 12,
  });

  // Category breakdown for this city
  const cityCategories: { category: string; count: number; categorySlug: string }[] = [];
  const countryCombos = summary?.categoriesByCity?.[country] || {};
  const cityMap = countryCombos[cityInfo.city] || countryCombos[cityInfo.city.trim()];
  if (cityMap) {
    for (const [catName, catCount] of Object.entries(cityMap)) {
      if (catCount > 0) {
        cityCategories.push({
          category: catName,
          count: catCount,
          categorySlug: getCategorySlug(catName),
        });
      }
    }
  }
  cityCategories.sort((a, b) => b.count - a.count);

  const canonicalUrl = `https://www.bizprimehub.com/cities/${countrySlug}/${citySlug}`;
  const introPrefix = count === 1
    ? `Find the verified business in ${cityInfo.city}, ${country} on BizPrimeHub.`
    : `Find verified businesses in ${cityInfo.city}, ${country} on BizPrimeHub.`;
  const introParagraph = `${introPrefix} Discover top-rated local services, company profiles, addresses, contact numbers, and reviews.`;

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
        name: country,
        item: `https://www.bizprimehub.com/cities/${countrySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityInfo.city,
        item: canonicalUrl,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Businesses in ${cityInfo.city}, ${country}`,
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
              <Link href={`/cities/${countrySlug}`} className="hover:text-blue-600 transition-colors">
                {country}
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{cityInfo.city}</span>
            </nav>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Businesses in {cityInfo.city}, {country}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
              {introParagraph}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {count} {count === 1 ? 'Business' : 'Businesses'}
              </span>
              <span className="text-xs text-slate-500">
                {cityCategories.length} {cityCategories.length === 1 ? 'Category' : 'Categories'} represented
              </span>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Verified Businesses in {cityInfo.city}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Top rated local businesses and service providers
              </p>
            </div>
            {totalResults > 12 && (
              <Link
                href={`/businesses?country=${encodeURIComponent(country)}&city=${encodeURIComponent(cityInfo.city)}`}
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
              No listings currently available in {cityInfo.city}.
            </div>
          )}

          {totalResults > 12 && (
            <div className="mt-8 text-center sm:hidden">
              <Link
                href={`/businesses?country=${encodeURIComponent(country)}&city=${encodeURIComponent(cityInfo.city)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all {totalResults} in {cityInfo.city}</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}

          {/* Categories in City breakdown */}
          {cityCategories.length > 0 && (
            <section className="mt-14 pt-10 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Browse Categories in {cityInfo.city}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Explore popular business types and services in {cityInfo.city}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {cityCategories.map((item) => (
                  <Link
                    key={item.category}
                    href={`/categories/${item.categorySlug}/${citySlug}`}
                    className="flex flex-col p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all group"
                  >
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {item.count} {item.count === 1 ? 'business' : 'businesses'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


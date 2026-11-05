import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { COUNTRIES, Country } from '@/data/locations';
import {
  getCountryBySlug,
  getCountrySlug,
  getCitySlug,
  getCategorySlug,
} from '@/lib/slugify';
import {
  fetchBusinessSummary,
  formatTitle,
  formatDescription,
  getCountryTotalCount,
} from '@/lib/landingData';

export const revalidate = 3600;

interface CountryPageProps {
  params: Promise<{ countrySlug: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({
    countrySlug: getCountrySlug(c),
  }));
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) return {};

  const summary = await fetchBusinessSummary();
  const count = getCountryTotalCount(summary, country);
  if (count <= 0) return {};

  const { baseTitle, finalTitle } = formatTitle(
    `Businesses in ${country} Directory`,
    `Businesses in ${country}`,
    country
  );

  const prefix = count === 1
    ? `Find the verified business in ${country} on BizPrimeHub.`
    : `Find verified businesses in ${country} on BizPrimeHub.`;
  const description = formatDescription(prefix);
  const canonical = `https://www.bizprimehub.com/cities/${countrySlug}`;

  return {
    title: baseTitle,
    description,
    robots: count < 3 ? { index: false, follow: true } : { index: true, follow: true },
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

export default async function CountryLandingPage({ params }: CountryPageProps) {
  const { countrySlug } = await params;
  const country = getCountryBySlug(countrySlug);
  if (!country) {
    notFound();
  }

  const summary = await fetchBusinessSummary();
  const count = getCountryTotalCount(summary, country);
  if (count <= 0) {
    notFound();
  }

  // Extract cities with counts for this country
  const cityMap = summary?.cities?.[country] || {};
  const citiesList: { city: string; count: number; citySlug: string }[] = [];
  for (const [cityName, cityCount] of Object.entries(cityMap)) {
    if (cityCount > 0) {
      citiesList.push({
        city: cityName,
        count: cityCount,
        citySlug: getCitySlug(cityName, country),
      });
    }
  }
  citiesList.sort((a, b) => b.count - a.count);

  // Extract categories with counts for this country
  const catMap = summary?.categories?.[country] || {};
  const categoriesList: { category: string; count: number; categorySlug: string }[] = [];
  for (const [catName, catCount] of Object.entries(catMap)) {
    if (catCount > 0) {
      categoriesList.push({
        category: catName,
        count: catCount,
        categorySlug: getCategorySlug(catName),
      });
    }
  }
  categoriesList.sort((a, b) => b.count - a.count);

  const canonicalUrl = `https://www.bizprimehub.com/cities/${countrySlug}`;
  const introPrefix = count === 1
    ? `Find the verified business in ${country} on BizPrimeHub.`
    : `Find verified businesses in ${country} on BizPrimeHub.`;
  const introParagraph = `${introPrefix} Find local company listings, contact details, reviews, and addresses.`;

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
        name: 'Businesses',
        item: 'https://www.bizprimehub.com/businesses',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: country,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
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
              <Link href="/businesses" className="hover:text-blue-600 transition-colors">
                Businesses
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{country}</span>
            </nav>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Businesses in {country}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
              {introParagraph}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {count} {count === 1 ? 'Business' : 'Businesses'}
              </span>
              <span className="text-xs text-slate-500">
                {citiesList.length} {citiesList.length === 1 ? 'City' : 'Cities'}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500">
                {categoriesList.length} {categoriesList.length === 1 ? 'Category' : 'Categories'}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Cities Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Cities in {country}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Browse verified listings in cities across {country}
                </p>
              </div>
              <Link
                href={`/businesses?country=${encodeURIComponent(country)}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all in {country}</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {citiesList.map((item) => (
                <Link
                  key={item.city}
                  href={`/cities/${countrySlug}/${item.citySlug}`}
                  className="flex flex-col p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all group"
                >
                  <span className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                    {item.city}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {item.count} {item.count === 1 ? 'business' : 'businesses'}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Categories Section */}
          <section className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Categories in {country}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Explore business categories active in {country}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categoriesList.map((item) => (
                <Link
                  key={item.category}
                  href={`/categories/${item.categorySlug}`}
                  className="flex flex-col p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all group"
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
        </div>
      </main>
      <Footer />
    </>
  );
}


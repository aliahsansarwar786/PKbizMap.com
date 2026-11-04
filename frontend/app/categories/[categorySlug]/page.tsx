import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessCard from '@/components/business/BusinessCard';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { CATEGORIES } from '@/data/categories';
import {
  getCategoryBySlug,
  getCategorySlug,
  getCitySlug,
  getCountrySlug,
} from '@/lib/slugify';
import {
  fetchBusinessSummary,
  fetchLandingBusinesses,
  formatTitle,
  formatDescription,
  getCategoryTotalCount,
} from '@/lib/landingData';

export const revalidate = 86400;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateStaticParams() {
  const summary = await fetchBusinessSummary();
  if (!summary) return [];

  const validParams: { categorySlug: string }[] = [];
  for (const cat of CATEGORIES) {
    const count = getCategoryTotalCount(summary, cat.name);
    if (count > 0) {
      validParams.push({ categorySlug: getCategorySlug(cat.name) });
    }
  }
  return validParams;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const categoryName = getCategoryBySlug(categorySlug);
  if (!categoryName) return {};

  const summary = await fetchBusinessSummary();
  const count = getCategoryTotalCount(summary, categoryName);
  if (count <= 0) return {};

  const { baseTitle, finalTitle } = formatTitle(
    `${categoryName} Businesses Directory`,
    `${categoryName} Businesses`,
    categoryName
  );

  const prefix = `Explore ${count} verified ${categoryName} businesses across Pakistan, UAE and the USA on BizPrimeHub.`;
  const description = formatDescription(prefix);
  const canonical = `https://www.bizprimehub.com/categories/${categorySlug}`;

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
      images: ['/og-default.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description,
      images: ['/og-default.jpg'],
    },
  };
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const categoryName = getCategoryBySlug(categorySlug);
  if (!categoryName) {
    notFound();
  }

  const summary = await fetchBusinessSummary();
  const count = getCategoryTotalCount(summary, categoryName);
  if (count <= 0) {
    notFound();
  }

  const { businesses, totalResults } = await fetchLandingBusinesses({
    category: categoryName,
    limit: 12,
  });

  // Extract cities that have listings for this category
  const citiesWithCategory: {
    city: string;
    country: string;
    count: number;
    citySlug: string;
    countrySlug: string;
  }[] = [];

  if (summary?.categoriesByCity) {
    for (const [country, cityMap] of Object.entries(summary.categoriesByCity)) {
      if (!cityMap) continue;
      for (const [cityName, catMap] of Object.entries(cityMap)) {
        const catCount = catMap?.[categoryName] || 0;
        if (catCount > 0) {
          citiesWithCategory.push({
            city: cityName,
            country,
            count: catCount,
            citySlug: getCitySlug(cityName),
            countrySlug: getCountrySlug(country),
          });
        }
      }
    }
  }

  // Sort cities descending by count
  citiesWithCategory.sort((a, b) => b.count - a.count);

  const canonicalUrl = `https://www.bizprimehub.com/categories/${categorySlug}`;
  const introParagraph = `Explore ${count} verified ${categoryName} businesses across Pakistan, UAE and the USA on BizPrimeHub. Find top-rated companies, contact numbers, addresses, and customer reviews.`;

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
        name: 'Categories',
        item: 'https://www.bizprimehub.com/categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: canonicalUrl,
      },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} Businesses on BizPrimeHub`,
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
              <Link href="/categories" className="hover:text-blue-600 transition-colors">
                Categories
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{categoryName}</span>
            </nav>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              {categoryName} Businesses
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
              {introParagraph}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {count} {count === 1 ? 'Listing' : 'Listings'} Available
              </span>
              <span className="text-xs text-slate-500">
                Across {citiesWithCategory.length} {citiesWithCategory.length === 1 ? 'city' : 'cities'}
              </span>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Verified {categoryName} Listings
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Showing top verified businesses in {categoryName}
              </p>
            </div>
            {totalResults > 12 && (
              <Link
                href={`/businesses?category=${encodeURIComponent(categoryName)}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all {totalResults} listings</span>
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
              No listings currently available in this category.
            </div>
          )}

          {totalResults > 12 && (
            <div className="mt-8 text-center sm:hidden">
              <Link
                href={`/businesses?category=${encodeURIComponent(categoryName)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-colors border border-blue-200"
              >
                <span>View all {totalResults} listings</span>
                <span>&rarr;</span>
              </Link>
            </div>
          )}

          {/* Cities breakdown */}
          {citiesWithCategory.length > 0 && (
            <section className="mt-14 pt-10 border-t border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Browse {categoryName} by City
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Find {categoryName.toLowerCase()} services and companies in your local city
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {citiesWithCategory.map((item) => (
                  <Link
                    key={`${item.country}-${item.city}`}
                    href={`/categories/${categorySlug}/${item.citySlug}`}
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


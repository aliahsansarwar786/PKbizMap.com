import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessDirectory from '@/components/business/BusinessDirectory';
import CategoryBreadcrumbs from '@/components/business/CategoryBreadcrumbs';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { CATEGORY_NAMES, CATEGORY_ALIASES } from '@/data/categories';

export const metadata: Metadata = {
  title: 'Business Directory — Find Local Businesses in Pakistan',
  description:
    'Browse 1,100+ trusted local businesses across Pakistan, UAE and the USA. Free business listing — add your business and get found on Google.',
  alternates: {
    canonical: 'https://www.bizprimehub.com/businesses',
  },
  openGraph: {
    title: 'Business Directory — Find Local Businesses in Pakistan | BizPrimeHub',
    description:
      'Browse 1,100+ trusted local businesses across Pakistan, UAE and the USA. Free business listing — add your business and get found on Google.',
    url: 'https://www.bizprimehub.com/businesses',
    siteName: 'BizPrimeHub',
    type: 'website',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Directory — Find Local Businesses in Pakistan | BizPrimeHub',
    description:
      'Browse 1,100+ trusted local businesses across Pakistan, UAE and the USA. Free business listing — add your business and get found on Google.',
    images: ['/og-default.jpg'],
  },
};

interface BusinessesPageProps {
  searchParams?: Promise<{ category?: string; [key: string]: string | string[] | undefined }>;
}

function sanitizeCategory(rawCategory?: string): string | undefined {
  if (!rawCategory || typeof rawCategory !== 'string') return undefined;
  const trimmed = rawCategory.trim();
  if (!trimmed) return undefined;
  const canonicalMatch = CATEGORY_NAMES.find(
    (name) => name.toLowerCase() === trimmed.toLowerCase()
  );
  if (canonicalMatch) return canonicalMatch;
  const aliasMatch = Object.keys(CATEGORY_ALIASES).find(
    (alias) => alias.toLowerCase() === trimmed.toLowerCase()
  );
  if (aliasMatch) return CATEGORY_ALIASES[aliasMatch];
  // Allow only plain text without HTML/script markup
  if (/^[\p{L}\p{N}\s&',.\-()]+$/u.test(trimmed) && !trimmed.includes('<') && !trimmed.includes('>')) {
    return trimmed;
  }
  return undefined;
}

export default async function BusinessesPage({ searchParams }: BusinessesPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawCategoryParam = typeof resolvedParams?.category === 'string' ? resolvedParams.category : undefined;
  const categoryParam = sanitizeCategory(rawCategoryParam);

  const breadcrumbJsonLd = categoryParam
    ? {
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
            name: categoryParam,
            item: `https://www.bizprimehub.com/businesses?category=${encodeURIComponent(categoryParam)}`,
          },
        ],
      }
    : null;

  return (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
        />
      )}
      <Navbar />
      <main>
        <div className="page-header">
          <div className="container-max">
            <Suspense fallback={null}>
              <CategoryBreadcrumbs initialCategory={categoryParam} />
            </Suspense>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
              Business Directory
            </h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Discover and connect with verified local businesses
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="container-max py-8 text-center text-gray-500">Loading directory...</div>}>
          <BusinessDirectory />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

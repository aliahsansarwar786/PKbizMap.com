import type { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessDirectory from '@/components/business/BusinessDirectory';

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

export default function BusinessesPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="page-header">
          <div className="container-max">
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

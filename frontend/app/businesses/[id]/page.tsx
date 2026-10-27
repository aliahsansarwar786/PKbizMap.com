import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BusinessDetail from '@/components/business/BusinessDetail';

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getBusiness(id: string) {
  const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
  const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';

  try {
    const res = await fetch(`${primaryApi}/businesses/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data?.business || null;
    }
    if (primaryApi !== fallbackApi) {
      const fbRes = await fetch(`${fallbackApi}/businesses/${id}`, {
        next: { revalidate: 3600 },
      });
      if (fbRes.ok) {
        const json = await fbRes.json();
        return json.data?.business || null;
      }
    }
  } catch (error) {
    if (primaryApi !== fallbackApi) {
      try {
        const fbRes = await fetch(`${fallbackApi}/businesses/${id}`, {
          next: { revalidate: 3600 },
        });
        if (fbRes.ok) {
          const json = await fbRes.json();
          return json.data?.business || null;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  return null;
}

export async function generateMetadata({ params }: BusinessDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusiness(id);

  if (!business) {
    return {
      title: 'Business Details',
      description: 'View business details, contact information, and reviews.',
    };
  }

  const city = (business.address?.city || '').trim();
  const category = (business.category || 'Business').trim();
  const title = `${business.title} — ${category}${city ? ` in ${city}` : ''}`;
  const slug = business.slug || id;
  const canonicalUrl = `https://www.bizprimehub.com/businesses/${slug}`;

  let rawDesc = (business.description || '').replace(/\s+/g, ' ').trim();
  let description = '';
  if (rawDesc) {
    description = rawDesc.length > 150 ? rawDesc.slice(0, 150).trim() : rawDesc;
  }
  if (!description) {
    description = `${business.title} is a ${category} business${city ? ` in ${city}` : ''}, listed for free on BizPrimeHub. View contact details, address and reviews.`;
  }

  const defaultOgImage = 'https://www.bizprimehub.com/og-default.jpg';
  const ogImage = business.images?.[0]?.url || defaultOgImage;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | BizPrimeHub`,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | BizPrimeHub`,
      description,
      images: [ogImage],
    },
  };
}

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default async function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = await params;
  const business = await getBusiness(id);

  // TASK 4: If opened with an old Mongo ID (or anything other than its slug),
  // permanently redirect (HTTP 308) to the slug URL BEFORE rendering
  if (business?.slug && id !== business.slug) {
    permanentRedirect(`/businesses/${business.slug}`);
  }

  let jsonLd = null;
  let breadcrumbJsonLd = null;
  if (business) {
    const city = (business.address?.city || '').trim();
    const country = (business.address?.country || 'Pakistan').trim();
    const street = (business.address?.street || '').trim();
    const zip = (business.address?.zipCode || '').trim();
    const rawDesc = (business.description || '').replace(/\s+/g, ' ').trim();
    const slug = business.slug || id;

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.title,
      url: `https://www.bizprimehub.com/businesses/${slug}`,
    };

    if (rawDesc) {
      schema.description = rawDesc;
    }

    if (business.images && Array.isArray(business.images) && business.images.length > 0) {
      const urls = business.images.map((img: any) => img?.url).filter(Boolean);
      if (urls.length === 1) {
        schema.image = urls[0];
      } else if (urls.length > 1) {
        schema.image = urls;
      }
    }

    const phone = (business.phone || business.whatsapp || '').trim();
    if (phone) {
      schema.telephone = phone;
    }

    const address: Record<string, any> = {
      '@type': 'PostalAddress',
    };
    let hasAddress = false;
    if (street) {
      address.streetAddress = street;
      hasAddress = true;
    }
    if (city) {
      address.addressLocality = city;
      hasAddress = true;
    }
    if (country) {
      address.addressCountry = country;
      hasAddress = true;
    }
    if (zip) {
      address.postalCode = zip;
      hasAddress = true;
    }
    if (hasAddress) {
      schema.address = address;
    }

    const avgRating = Number(business.averageRating);
    const reviewCount = Number(business.reviewCount);
    if (!isNaN(avgRating) && avgRating > 0 && !isNaN(reviewCount) && reviewCount > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviewCount,
      };
    }

    jsonLd = schema;

    const categoryName = (business.category || 'Business').trim();
    breadcrumbJsonLd = {
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
          name: categoryName,
          item: `https://www.bizprimehub.com/businesses?category=${encodeURIComponent(categoryName)}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: business.title,
          item: `https://www.bizprimehub.com/businesses/${slug}`,
        },
      ],
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
        />
      )}
      <Navbar />
      <main>
        <BusinessDetail id={business?.slug || id} />
      </main>
      <Footer />
    </>
  );
}

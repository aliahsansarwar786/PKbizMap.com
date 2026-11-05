import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { safeJsonLd } from '@/lib/safeJsonLd';
import BusinessDetail from '@/components/business/BusinessDetail';
import BusinessCard from '@/components/business/BusinessCard';
import {
  getCategorySlug,
  getCityBySlug,
  getCountrySlug,
  slugify,
} from '@/lib/slugify';
import { fetchLandingBusinesses } from '@/lib/landingData';

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cutAtWordBoundary(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen + 1);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 0) {
    return sub.slice(0, lastSpace).trim();
  }
  return str.slice(0, maxLen).trim();
}

async function getBusiness(id: string) {
  const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
  const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';

  try {
    const res = await fetch(`${primaryApi}/businesses/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data?.business || null;
    }
    if (primaryApi !== fallbackApi) {
      const fbRes = await fetch(`${fallbackApi}/businesses/${encodeURIComponent(id)}`, {
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
        const fbRes = await fetch(`${fallbackApi}/businesses/${encodeURIComponent(id)}`, {
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

  const name = decodeHtmlEntities(business.title || '').trim();
  const category = (business.category || 'Business').trim();
  const city = (business.address?.city || '').trim();

  const nameContainsCity = Boolean(city && name.toLowerCase().includes(city.toLowerCase()));
  const inCity = city && !nameContainsCity ? ` in ${city}` : '';

  const candA = `${name} — ${category}${inCity}`;
  const candB = `${name}${inCity}`;
  const candC = `${name} — ${category}`;
  const candD = cutAtWordBoundary(name, 46);

  let baseTitle = candD;
  if (candA.length <= 46) {
    baseTitle = candA;
  } else if (candB.length <= 46) {
    baseTitle = candB;
  } else if (candC.length <= 46) {
    baseTitle = candC;
  }

  const finalTitle = `${baseTitle} | BizPrimeHub`;
  const slug = business.slug || id;
  const canonicalUrl = `https://www.bizprimehub.com/businesses/${slug}`;

  let firstSentence = '';
  if (business.description) {
    const cleanDesc = decodeHtmlEntities(business.description).replace(/\s+/g, ' ').trim();
    if (cleanDesc) {
      const match = cleanDesc.match(/^(.*?[.!?])(?:\s|$)/);
      firstSentence = match ? match[1].trim() : cleanDesc;
    }
  }

  const street = (business.address?.street || '').trim();
  let middle = '';
  if (firstSentence) {
    middle = firstSentence;
  } else if (street) {
    middle = street.endsWith('.') ? street : `${street}.`;
  }

  let composedDesc = '';
  if (middle) {
    const intro = city ? `${name} is a ${category} business in ${city}.` : `${name} is a ${category} business.`;
    composedDesc = `${intro} ${middle} Find phone, address and reviews on BizPrimeHub.`;
  } else {
    composedDesc = `${name} is a ${category} business in ${city ? `${city}, Pakistan` : 'Pakistan'}. Find phone, address and reviews on BizPrimeHub.`;
  }

  const description = cutAtWordBoundary(composedDesc, 156);

  const defaultOgImage = 'https://www.bizprimehub.com/og-default.jpg';
  const ogImage = business.images?.[0]?.url || defaultOgImage;

  return {
    title: baseTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: finalTitle,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          alt: finalTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description,
      images: [ogImage],
    },
  };
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
  let introParagraph = '';
  let decodedTitle = '';
  let categorySlug = '';
  let cityInfo: ReturnType<typeof getCityBySlug> = undefined;
  let countrySlug = '';
  let citySlug = '';
  let cityName = '';
  let categoryName = '';
  let similarBusinesses: any[] = [];

  if (business) {
    categoryName = (business.category || 'Business').trim();
    categorySlug = getCategorySlug(categoryName);
    const rawCity = (business.address?.city || '').trim();
    if (rawCity) {
      cityInfo = getCityBySlug(slugify(rawCity));
      if (cityInfo) {
        countrySlug = getCountrySlug(cityInfo.country);
        citySlug = cityInfo.slug;
        cityName = cityInfo.city;

        try {
          const similarRes = await fetchLandingBusinesses({
            category: business.category,
            city: cityName,
            limit: 9,
          });
          if (similarRes?.businesses && Array.isArray(similarRes.businesses)) {
            similarBusinesses = similarRes.businesses
              .filter((b: any) => {
                const isSameId = b._id && business._id && String(b._id) === String(business._id);
                const isSameSlug = b.slug && business.slug && b.slug === business.slug;
                return !isSameId && !isSameSlug;
              })
              .slice(0, 8);
          }
        } catch (e) {
          similarBusinesses = [];
        }
      }
    }

    decodedTitle = decodeHtmlEntities(business.title || '').trim();
    const city = (business.address?.city || '').trim();
    const country = (business.address?.country || 'Pakistan').trim();
    const street = (business.address?.street || '').trim();
    const location = city ? `${city}, ${country}` : country;
    introParagraph = `${decodedTitle} is a ${categoryName} business in ${location}.${street ? ` ${street}` : ''}`;

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
        {business && (
          <div className="container-max pt-6">
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#1f2937' }}>
              {decodedTitle}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
              {introParagraph}
            </p>
          </div>
        )}
        <BusinessDetail id={business?.slug || id} />

        {business && (
          <>
            {/* Part 1.1: Browse more section */}
            <section className="container-max py-8">
              <div className="border-t border-slate-200/80 pt-6">
                <h2 className="text-base font-bold text-slate-800 mb-3">Browse more</h2>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <Link
                    href={`/categories/${categorySlug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                  >
                    <span>More {categoryName} businesses</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  {cityInfo && (
                    <>
                      <Link
                        href={`/cities/${countrySlug}/${citySlug}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                      >
                        <span>More businesses in {cityName}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                      <Link
                        href={`/categories/${categorySlug}/${citySlug}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                      >
                        <span>More {categoryName} in {cityName}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Part 1.2: Similar businesses card row */}
            {similarBusinesses.length > 0 && (
              <section className="container-max pb-14">
                <div className="border-t border-slate-200/80 pt-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-5">
                    More {categoryName} in {cityName}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {similarBusinesses.map((b: any) => (
                      <BusinessCard key={b._id} business={b} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

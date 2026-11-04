import { MetadataRoute } from 'next';
import { getAllPosts } from '@/data/blogPosts';
import { CATEGORIES } from '@/data/categories';
import { COUNTRIES } from '@/data/locations';
import {
  getCategorySlug,
  getCountrySlug,
  getCitySlug,
} from '@/lib/slugify';
import {
  fetchBusinessSummary,
  getCategoryTotalCount,
} from '@/lib/landingData';

export const revalidate = 86400;

interface BusinessSitemapItem {
  _id: string;
  slug?: string;
  updatedAt?: string;
  createdAt?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, page: number, label: string) {
  // First attempt
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) return await res.json();
    console.error(`[Sitemap] ${label} non-ok response (${res.status}) on page ${page}. Retrying in 500ms...`);
  } catch (err: any) {
    console.error(`[Sitemap] ${label} fetch error on page ${page}: ${err?.message || err}. Retrying in 500ms...`);
  }

  // Delay before retry
  await delay(500);

  // Retry attempt
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok) return await res.json();
    console.error(`[Sitemap] ${label} retry failed with HTTP status ${res.status} on page ${page}`);
  } catch (err: any) {
    console.error(`[Sitemap] ${label} retry failed on page ${page}: ${err?.message || err}`);
  }

  return null;
}

async function fetchBusinessesPage(page: number) {
  const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
  const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';

  const primaryResult = await fetchWithRetry(`${primaryApi}/businesses?limit=50&page=${page}`, page, 'Primary API');
  if (primaryResult) return primaryResult;

  if (primaryApi !== fallbackApi) {
    console.error(`[Sitemap] Primary API failed for page ${page}. Attempting fallback API...`);
    const fallbackResult = await fetchWithRetry(`${fallbackApi}/businesses?limit=50&page=${page}`, page, 'Fallback API');
    if (fallbackResult) return fallbackResult;
  }

  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.bizprimehub.com';
  const blogPosts = getAllPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/businesses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/add-business`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  let landingRoutes: MetadataRoute.Sitemap = [];
  try {
    const summary = await fetchBusinessSummary();
    if (summary) {
      // 1. Categories (count > 0)
      for (const cat of CATEGORIES) {
        const count = getCategoryTotalCount(summary, cat.name);
        if (count > 0) {
          landingRoutes.push({
            url: `${baseUrl}/categories/${getCategorySlug(cat.name)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      // 2. Countries (count > 0)
      for (const country of COUNTRIES) {
        const count = summary.countries?.[country] || 0;
        if (count > 0) {
          landingRoutes.push({
            url: `${baseUrl}/cities/${getCountrySlug(country)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      // 3. Cities (count > 0)
      for (const country of COUNTRIES) {
        const cityMap = summary.cities?.[country] || {};
        for (const [cityName, cityCount] of Object.entries(cityMap)) {
          if (cityCount > 0) {
            landingRoutes.push({
              url: `${baseUrl}/cities/${getCountrySlug(country)}/${getCitySlug(cityName, country)}`,
              lastModified: new Date(),
              changeFrequency: 'weekly',
              priority: 0.75,
            });
          }
        }
      }

      // 4. Nonzero Combos
      if (summary.categoriesByCity) {
        for (const country of COUNTRIES) {
          const countryCombos = summary.categoriesByCity[country] || {};
          for (const [cityName, catMap] of Object.entries(countryCombos)) {
            for (const [catName, catCount] of Object.entries(catMap || {})) {
              if (catCount > 0) {
                landingRoutes.push({
                  url: `${baseUrl}/categories/${getCategorySlug(catName)}/${getCitySlug(cityName, country)}`,
                  lastModified: new Date(),
                  changeFrequency: 'weekly',
                  priority: 0.75,
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching landing routes for sitemap:', err);
  }

  let businessRoutes: MetadataRoute.Sitemap = [];
  let failedPagesCount = 0;

  try {
    const firstData = await fetchBusinessesPage(1);

    if (!firstData) {
      failedPagesCount++;
      console.error(
        '[Sitemap] CRITICAL: Page 1 failed to load. The sitemap will contain 0 business URLs (static + blog routes only).'
      );
    } else if (firstData.data) {
      const totalPages = firstData.data?.pagination?.totalPages || 1;
      const allBusinesses: BusinessSitemapItem[] = [...(firstData.data?.businesses || [])];

      if (totalPages > 1) {
        const pagesToFetch: number[] = [];
        for (let p = 2; p <= totalPages; p++) {
          pagesToFetch.push(p);
        }

        const BATCH_SIZE = 5;
        for (let i = 0; i < pagesToFetch.length; i += BATCH_SIZE) {
          const batch = pagesToFetch.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map((page) => fetchBusinessesPage(page))
          );

          for (const resData of batchResults) {
            if (resData?.data?.businesses && Array.isArray(resData.data.businesses)) {
              allBusinesses.push(...resData.data.businesses);
            } else {
              failedPagesCount++;
            }
          }
        }
      }

      businessRoutes = allBusinesses.map((b) => ({
        url: `${baseUrl}/businesses/${b.slug || b._id}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : b.createdAt ? new Date(b.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }

    if (failedPagesCount > 0) {
      console.error(
        `[Sitemap] SUMMARY: Sitemap generation finished with ${failedPagesCount} failed page(s). Total business URLs included: ${businessRoutes.length}.`
      );
    }
  } catch (err) {
    console.error('Error fetching businesses for sitemap:', err);
    businessRoutes = [];
  }

  return [...staticRoutes, ...blogRoutes, ...landingRoutes, ...businessRoutes];
}

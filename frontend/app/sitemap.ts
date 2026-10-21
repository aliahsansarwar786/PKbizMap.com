import { MetadataRoute } from 'next';
import { getAllPosts } from '@/data/blogPosts';

export const revalidate = 86400;

interface BusinessSitemapItem {
  _id: string;
  updatedAt?: string;
  createdAt?: string;
}

async function fetchBusinessesPage(page: number) {
  const primaryApi = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
  const fallbackApi = 'https://pkbizmap-backend.vercel.app/api';

  try {
    const res = await fetch(`${primaryApi}/businesses?limit=50&page=${page}`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) return await res.json();
    if (primaryApi !== fallbackApi) {
      const fbRes = await fetch(`${fallbackApi}/businesses?limit=50&page=${page}`, {
        next: { revalidate: 86400 },
      });
      if (fbRes.ok) return await fbRes.json();
    }
  } catch (err) {
    if (primaryApi !== fallbackApi) {
      try {
        const fbRes = await fetch(`${fallbackApi}/businesses?limit=50&page=${page}`, {
          next: { revalidate: 86400 },
        });
        if (fbRes.ok) return await fbRes.json();
      } catch (e) {
        return null;
      }
    }
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

  let businessRoutes: MetadataRoute.Sitemap = [];

  try {
    const firstData = await fetchBusinessesPage(1);

    if (firstData && firstData.data) {
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
            }
          }
        }
      }

      businessRoutes = allBusinesses.map((b) => ({
        url: `${baseUrl}/businesses/${b._id}`,
        lastModified: b.updatedAt ? new Date(b.updatedAt) : b.createdAt ? new Date(b.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.error('Error fetching businesses for sitemap:', err);
    businessRoutes = [];
  }

  return [...staticRoutes, ...blogRoutes, ...businessRoutes];
}

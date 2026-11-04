import { Country } from '@/data/locations';
import { normalizeCategory } from '@/data/categories';

export interface SummaryData {
  total: number;
  countries: Record<string, number>;
  cities: {
    Pakistan?: Record<string, number>;
    UAE?: Record<string, number>;
    USA?: Record<string, number>;
    [key: string]: Record<string, number> | undefined;
  };
  categories: {
    Pakistan?: Record<string, number>;
    UAE?: Record<string, number>;
    USA?: Record<string, number>;
    [key: string]: Record<string, number> | undefined;
  };
  categoriesByCity: {
    Pakistan?: Record<string, Record<string, number>>;
    UAE?: Record<string, Record<string, number>>;
    USA?: Record<string, Record<string, number>>;
    [key: string]: Record<string, Record<string, number>> | undefined;
  };
}

const PRIMARY_API = process.env.NEXT_PUBLIC_API_URL || 'https://pkbizmap-backend.vercel.app/api';
const FALLBACK_API = 'https://pkbizmap-backend.vercel.app/api';

export async function fetchBusinessSummary(): Promise<SummaryData | null> {
  try {
    const res = await fetch(`${PRIMARY_API}/businesses/summary`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data as SummaryData;
    }
  } catch (err) {
    // try fallback
  }

  if (PRIMARY_API !== FALLBACK_API) {
    try {
      const fbRes = await fetch(`${FALLBACK_API}/businesses/summary`, {
        next: { revalidate: 86400 },
      });
      if (fbRes.ok) {
        const json = await fbRes.json();
        if (json?.data) return json.data as SummaryData;
      }
    } catch (fbErr) {
      // ignore
    }
  }

  return null;
}

export interface FetchBusinessesParams {
  category?: string;
  city?: string;
  country?: string;
  limit?: number;
}

export async function fetchLandingBusinesses(params: FetchBusinessesParams): Promise<{
  businesses: any[];
  totalResults: number;
}> {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit || 12));
  if (params.category) query.set('category', params.category);
  if (params.city) query.set('city', params.city);
  if (params.country) query.set('country', params.country);

  const qs = query.toString();

  try {
    const res = await fetch(`${PRIMARY_API}/businesses?${qs}`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = await res.json();
      return {
        businesses: json.data?.businesses || [],
        totalResults: json.data?.pagination?.totalResults || 0,
      };
    }
  } catch (err) {
    // fallback
  }

  if (PRIMARY_API !== FALLBACK_API) {
    try {
      const fbRes = await fetch(`${FALLBACK_API}/businesses?${qs}`, {
        next: { revalidate: 86400 },
      });
      if (fbRes.ok) {
        const json = await fbRes.json();
        return {
          businesses: json.data?.businesses || [],
          totalResults: json.data?.pagination?.totalResults || 0,
        };
      }
    } catch (fbErr) {
      // ignore
    }
  }

  return { businesses: [], totalResults: 0 };
}

// ─── Formatting & SEO Helpers ────────────────────────────────────────────────

export function cutAtWordBoundary(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen + 1);
  const lastSpace = sub.lastIndexOf(' ');
  const cut = (lastSpace > 0 ? sub.slice(0, lastSpace) : str.slice(0, maxLen)).replace(
    /[,\s.\-–—]+$/,
    ''
  );
  return cut;
}

export interface TitleResult {
  baseTitle: string;
  finalTitle: string;
}

export function formatTitle(candA: string, candB?: string, fallback?: string): TitleResult {
  let base = fallback || cutAtWordBoundary(candA, 46);
  if (candA.length <= 46) {
    base = candA;
  } else if (candB && candB.length <= 46) {
    base = candB;
  }
  return {
    baseTitle: base,
    finalTitle: `${base} | BizPrimeHub`,
  };
}

const COMMON_SUFFIXES = [
  ' Browse top-rated company profiles, addresses, contact numbers, customer reviews and local services.',
  ' Discover top-rated company listings, phone numbers, addresses, reviews and verified local services.',
  ' Browse top-rated company profiles, phone numbers, addresses, reviews and local services.',
  ' Find ratings, contact numbers, addresses, customer reviews and verified local services.',
  ' Browse ratings, contact numbers, addresses, customer reviews and verified services.',
  ' Find ratings, phone numbers, addresses, reviews and verified local services.',
  ' Find contact numbers, addresses, customer reviews and verified local services.',
  ' Find phone numbers, addresses, customer reviews and verified services.',
  ' Browse company profiles, addresses, phone numbers and reviews.',
  ' Find ratings, phone numbers, addresses and verified services.',
  ' Browse contact details, addresses, ratings and customer reviews.',
  ' Find contact numbers, addresses and verified local services.',
  ' Browse phone numbers, addresses and verified services.',
  ' Find addresses, contact details and customer reviews.',
  ' Browse company addresses, phone numbers and reviews.',
  ' Find phone numbers, addresses and reviews.',
  ' Browse company profiles, contact numbers and addresses.',
];

export function formatDescription(prefix: string): string {
  for (const s of COMMON_SUFFIXES) {
    const full = prefix + s;
    if (full.length >= 140 && full.length <= 156) {
      return full;
    }
  }

  for (const s of COMMON_SUFFIXES) {
    const full = prefix + s;
    if (full.length > 156) {
      const cut = cutAtWordBoundary(full, 155) + '.';
      if (cut.length >= 140 && cut.length <= 156) {
        return cut;
      }
    }
  }

  return cutAtWordBoundary(prefix + COMMON_SUFFIXES[0], 155) + '.';
}

// ─── Summary Count Extraction Helpers ────────────────────────────────────────

export function getCategoryTotalCount(summary: SummaryData | null, categoryName: string): number {
  if (!summary?.categories) return 0;
  const canonical = normalizeCategory(categoryName);
  let total = 0;
  for (const country of ['Pakistan', 'UAE', 'USA']) {
    const map = summary.categories[country] || {};
    total += map[canonical] || 0;
  }
  return total;
}

export function getCountryTotalCount(summary: SummaryData | null, country: Country): number {
  if (!summary?.countries) return 0;
  return summary.countries[country] || 0;
}

export function getCityTotalCount(
  summary: SummaryData | null,
  country: Country,
  city: string
): number {
  if (!summary?.cities) return 0;
  const countryMap = summary.cities[country] || {};
  const c = city.trim();
  if (countryMap[c] !== undefined) return countryMap[c];
  for (const [k, v] of Object.entries(countryMap)) {
    if (k.toLowerCase() === c.toLowerCase()) return v;
  }
  return 0;
}

export function getComboTotalCount(
  summary: SummaryData | null,
  country: Country,
  city: string,
  category: string
): number {
  if (!summary?.categoriesByCity) return 0;
  const countryMap = summary.categoriesByCity[country] || {};
  const canonicalCat = normalizeCategory(category);
  const cityMap = countryMap[city] || countryMap[city.trim()];
  if (cityMap) {
    return cityMap[canonicalCat] || 0;
  }
  for (const [cityName, cats] of Object.entries(countryMap)) {
    if (cityName.toLowerCase() === city.toLowerCase().trim()) {
      return cats[canonicalCat] || 0;
    }
  }
  return 0;
}


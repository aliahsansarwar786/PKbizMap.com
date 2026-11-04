import { CATEGORIES, CATEGORY_NAMES, CATEGORY_ALIASES, normalizeCategory } from '@/data/categories';
import { COUNTRIES, Country } from '@/data/locations';
import locationsData from '@/data/locations.json';

/**
 * Slugify a string according to BizPrimeHub technical SEO rules:
 * - NFKD normalize
 * - Strip diacritics
 * - Lowercase
 * - Trim
 * - '&' -> space
 * - Non-alphanumeric -> '-'
 * - Trim leading/trailing '-'
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Categories ──────────────────────────────────────────────────────────────
export const CATEGORY_SLUG_MAP: Record<string, string> = {};
export const CATEGORY_TO_SLUG: Record<string, string> = {};

for (const cat of CATEGORIES) {
  const slug = slugify(cat.name);
  CATEGORY_SLUG_MAP[slug] = cat.name;
  CATEGORY_TO_SLUG[cat.name] = slug;
}

// Map aliases as well to canonical category names
for (const [alias, canonical] of Object.entries(CATEGORY_ALIASES)) {
  const aliasSlug = slugify(alias);
  if (!CATEGORY_SLUG_MAP[aliasSlug]) {
    CATEGORY_SLUG_MAP[aliasSlug] = canonical;
  }
}

export function getCategoryBySlug(slug: string): string | undefined {
  if (!slug) return undefined;
  return CATEGORY_SLUG_MAP[slug.toLowerCase().trim()];
}

export function getCategorySlug(categoryName: string): string {
  const canonical = normalizeCategory(categoryName);
  return CATEGORY_TO_SLUG[canonical] || slugify(canonical);
}

// ─── Countries ───────────────────────────────────────────────────────────────
export const COUNTRY_SLUG_MAP: Record<string, Country> = {
  pakistan: 'Pakistan',
  uae: 'UAE',
  usa: 'USA',
};

export const COUNTRY_TO_SLUG: Record<Country, string> = {
  Pakistan: 'pakistan',
  UAE: 'uae',
  USA: 'usa',
};

export function getCountryBySlug(slug: string): Country | undefined {
  if (!slug) return undefined;
  return COUNTRY_SLUG_MAP[slug.toLowerCase().trim()];
}

export function getCountrySlug(country: string): string {
  const c = country as Country;
  return COUNTRY_TO_SLUG[c] || slugify(country);
}

// ─── Cities ──────────────────────────────────────────────────────────────────
export interface CityInfo {
  city: string;
  country: Country;
  slug: string;
}

const typedLocations = locationsData as Record<Country, string[]>;
export const CITY_SLUG_MAP: Record<string, CityInfo> = {};
export const CITY_TO_SLUG: Record<string, string> = {};

for (const country of COUNTRIES) {
  const cities = typedLocations[country] || [];
  for (const city of cities) {
    const slug = slugify(city);
    const info: CityInfo = { city, country, slug };
    CITY_SLUG_MAP[slug] = info;
    CITY_TO_SLUG[`${country.toLowerCase()}:${city.toLowerCase()}`] = slug;
    if (!CITY_TO_SLUG[city.toLowerCase()]) {
      CITY_TO_SLUG[city.toLowerCase()] = slug;
    }
  }
}

export function getCityBySlug(slug: string, country?: Country): CityInfo | undefined {
  if (!slug) return undefined;
  const info = CITY_SLUG_MAP[slug.toLowerCase().trim()];
  if (!info) return undefined;
  if (country && info.country.toLowerCase() !== country.toLowerCase()) {
    return undefined;
  }
  return info;
}

export function getCitySlug(city: string, country?: Country): string {
  if (country) {
    const key = `${country.toLowerCase()}:${city.toLowerCase().trim()}`;
    if (CITY_TO_SLUG[key]) return CITY_TO_SLUG[key];
  }
  const byName = CITY_TO_SLUG[city.toLowerCase().trim()];
  if (byName) return byName;
  return slugify(city);
}


import locationsData from './locations.json';

export type Country = 'Pakistan' | 'UAE' | 'USA';

export const COUNTRIES: Country[] = ['Pakistan', 'UAE', 'USA'];

export const LOCATIONS: Record<Country, string[]> = locationsData as Record<Country, string[]>;

/**
 * Returns list of supported countries.
 */
export function getCountries(): Country[] {
  return COUNTRIES;
}

/**
 * Returns list of cities for a given country.
 */
export function getCities(country?: string | null): string[] {
  if (!country || !(country in LOCATIONS)) return [];
  return LOCATIONS[country as Country] || [];
}

/**
 * Checks if a city is valid for a given country.
 */
export function isValidCity(country?: string | null, city?: string | null): boolean {
  if (!country || !city) return false;
  const cities = getCities(country);
  const cleanCity = city.trim().toLowerCase();
  return cities.some((c) => c.toLowerCase() === cleanCity);
}

export default LOCATIONS;

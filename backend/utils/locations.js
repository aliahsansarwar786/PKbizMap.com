const locations = require('../data/locations.json');

const COUNTRIES = ['Pakistan', 'UAE', 'USA'];

/**
 * Returns list of supported countries.
 */
function getCountries() {
  return COUNTRIES;
}

/**
 * Returns sorted list of cities for a given country.
 */
function getCities(country) {
  if (!country || !locations[country]) return [];
  return locations[country];
}

/**
 * Validates whether a country is in the supported list.
 */
function isValidCountry(country) {
  return COUNTRIES.includes(country);
}

/**
 * Validates whether a city belongs to a supported country (case-insensitive).
 */
function isValidCity(country, city) {
  if (!country || !city) return false;
  const cities = locations[country];
  if (!cities) return false;
  const cleanCity = city.trim().toLowerCase();
  return cities.some((c) => c.toLowerCase() === cleanCity);
}

module.exports = {
  COUNTRIES,
  locations,
  getCountries,
  getCities,
  isValidCountry,
  isValidCity,
};

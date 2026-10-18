// Single source of truth for categories on BizPrimeHub backend

const CATEGORIES = [
  'IT',
  'Real Estate',
  'Restaurant',
  'Healthcare',
  'Education',
  'Automotive',
  'Retail',
  'Finance',
  'Beauty',
  'Travel',
  'Professional Services',
  'Construction',
  'Hotels & Hospitality',
  'Home Services',
  'Fashion & Clothing',
  'Electronics & Mobiles',
  'Sports & Fitness',
];

const CATEGORY_MAP = {
  'Bank': 'Finance',
  'Hospital': 'Healthcare',
  'Laboratory': 'Healthcare',
  'Restaurants & Food Chains': 'Restaurant',
  'Hotels & Guest Houses': 'Hotels & Hospitality',
  'Information Technology (IT) & Services': 'IT',
  'Telecom Companies': 'IT',
  'Shopping & Retail Chains': 'Retail',
  'Local Shops & Traders': 'Retail',
  'Bus Companies': 'Travel',
  'Courier & Cargo Companies': 'Professional Services',
  'Importer and Exporter': 'Professional Services',
};

// Returns canonical category name if an alias exists
function normalizeCategory(category) {
  if (!category || typeof category !== 'string') return category;
  const trimmed = category.trim();
  return CATEGORY_MAP[trimmed] || trimmed;
}

// Returns an array of category names to search for (canonical + all legacy aliases that map to it)
function getCategorySearchValues(queryCategory) {
  if (!queryCategory || typeof queryCategory !== 'string') return [];
  const canonical = normalizeCategory(queryCategory);
  const aliases = Object.keys(CATEGORY_MAP).filter((alias) => CATEGORY_MAP[alias] === canonical);
  return Array.from(new Set([canonical, ...aliases]));
}

module.exports = {
  CATEGORIES,
  CATEGORY_MAP,
  normalizeCategory,
  getCategorySearchValues,
};

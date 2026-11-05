export interface Category {
  name: string;
  image: string;
  description: string;
}

// Canonical source of truth: 17 categories for BizPrimeHub
export const CATEGORIES: Category[] = [
  {
    name: 'IT',
    image: '/images/category-it.jpg',
    description: 'Software, web development, IT services and tech companies',
  },
  {
    name: 'Restaurant',
    image: '/images/category-restaurant.jpg',
    description: 'Restaurants, cafes, food delivery, and catering',
  },
  {
    name: 'Healthcare',
    image: '/images/category-healthcare.jpg',
    description: 'Clinics, hospitals, doctors, dentists, and wellness',
  },
  {
    name: 'Education',
    image: '/images/category-education.jpg',
    description: 'Schools, tutoring, courses, and educational services',
  },
  {
    name: 'Retail',
    image: '/images/category-retail.jpg',
    description: 'Shops, stores, boutiques, and online retail',
  },
  {
    name: 'Finance',
    image: '/images/category-finance.jpg',
    description: 'Banks, accountants, financial advisors, and insurance',
  },
  {
    name: 'Hotels & Hospitality',
    image: '/images/category-hotels-hospitality.jpg',
    description: 'Hotels, resorts, luxury stays, guest houses, and hospitality services',
  },
  {
    name: 'Travel',
    image: '/images/category-travel.jpg',
    description: 'Travel agencies, hotels, and tourism services',
  },
  {
    name: 'Real Estate',
    image: '/images/category-real-estate.jpg',
    description: 'Property listings, agents, and real estate services',
  },
  {
    name: 'Automotive',
    image: '/images/category-automotive.jpg',
    description: 'Car dealers, repair shops, and auto services',
  },
  {
    name: 'Beauty',
    image: '/images/category-beauty.jpg',
    description: 'Salons, spas, barbershops, and beauty services',
  },
  {
    name: 'Professional Services',
    image: '/images/category-professional-services.jpg',
    description: 'Lawyers, consultants, and professional services',
  },
  {
    name: 'Construction',
    image: '/images/category-construction.jpg',
    description: 'Contractors, builders, and construction companies',
  },
  {
    name: 'Home Services',
    image: '/images/category-home-services.jpg',
    description: 'Plumbing, electrical, cleaning, maintenance, and home repair services',
  },
  {
    name: 'Fashion & Clothing',
    image: '/images/category-fashion-clothing.jpg',
    description: 'Apparel, boutiques, footwear, fashion accessories, and clothing stores',
  },
  {
    name: 'Electronics & Mobiles',
    image: '/images/category-electronics-mobiles.jpg',
    description: 'Smartphones, laptops, home electronics, gadgets, and repair accessories',
  },
  {
    name: 'Sports & Fitness',
    image: '/images/category-sports-fitness.jpg',
    description: 'Gyms, fitness centers, sports gear, personal trainers, and athletics',
  },
];

// String array of category names for easy mapping/filters
export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

// Legacy category alias map for backward-compatibility
export const CATEGORY_ALIASES: Record<string, string> = {
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

// Normalize any category (legacy or current) to its canonical name
export function normalizeCategory(category: string): string {
  if (!category) return category;
  const trimmed = category.trim();
  return CATEGORY_ALIASES[trimmed] || trimmed;
}

export default CATEGORIES;

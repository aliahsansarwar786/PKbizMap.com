export interface Category {
  name: string;
  image: string;
  description: string;
}

// Canonical source of truth: 17 categories for BizPrimeHub
export const CATEGORIES: Category[] = [
  {
    name: 'IT',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
    description: 'Software, web development, IT services and tech companies',
  },
  {
    name: 'Restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
    description: 'Restaurants, cafes, food delivery, and catering',
  },
  {
    name: 'Healthcare',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&q=80',
    description: 'Clinics, hospitals, doctors, dentists, and wellness',
  },
  {
    name: 'Education',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80',
    description: 'Schools, tutoring, courses, and educational services',
  },
  {
    name: 'Retail',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
    description: 'Shops, stores, boutiques, and online retail',
  },
  {
    name: 'Finance',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80',
    description: 'Banks, accountants, financial advisors, and insurance',
  },
  {
    name: 'Hotels & Hospitality',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
    description: 'Hotels, resorts, luxury stays, guest houses, and hospitality services',
  },
  {
    name: 'Travel',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80',
    description: 'Travel agencies, hotels, and tourism services',
  },
  {
    name: 'Real Estate',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80',
    description: 'Property listings, agents, and real estate services',
  },
  {
    name: 'Automotive',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80',
    description: 'Car dealers, repair shops, and auto services',
  },
  {
    name: 'Beauty',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
    description: 'Salons, spas, barbershops, and beauty services',
  },
  {
    name: 'Professional Services',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=80',
    description: 'Lawyers, consultants, and professional services',
  },
  {
    name: 'Construction',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80',
    description: 'Contractors, builders, and construction companies',
  },
  {
    name: 'Home Services',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80',
    description: 'Plumbing, electrical, cleaning, maintenance, and home repair services',
  },
  {
    name: 'Fashion & Clothing',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80',
    description: 'Apparel, boutiques, footwear, fashion accessories, and clothing stores',
  },
  {
    name: 'Electronics & Mobiles',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80',
    description: 'Smartphones, laptops, home electronics, gadgets, and repair accessories',
  },
  {
    name: 'Sports & Fitness',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
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

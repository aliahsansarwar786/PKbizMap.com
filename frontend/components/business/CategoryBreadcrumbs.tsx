'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeJsonLd } from '@/lib/safeJsonLd';

interface CategoryBreadcrumbsProps {
  initialCategory?: string;
}

export default function CategoryBreadcrumbs({ initialCategory }: CategoryBreadcrumbsProps) {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') || initialCategory;
  const category = rawCategory && !rawCategory.includes('<') && !rawCategory.includes('>')
    ? rawCategory.trim()
    : undefined;

  if (!category) return null;

  const breadcrumbJsonLd = {
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
        name: 'Categories',
        item: 'https://www.bizprimehub.com/categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category,
        item: `https://www.bizprimehub.com/businesses?category=${encodeURIComponent(category)}`,
      },
    ],
  };

  const shouldRenderClientJsonLd = category !== initialCategory;

  return (
    <>
      {shouldRenderClientJsonLd && (
        <script
          id="category-breadcrumb-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
        />
      )}
      <nav aria-label="Breadcrumb" className="mb-3 text-xs sm:text-sm text-gray-500">
        <ol className="flex items-center flex-wrap gap-1.5 leading-normal">
          <li className="flex items-center gap-1.5">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-gray-400 select-none">›</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Link href="/categories" className="hover:text-blue-600 transition-colors">
              Categories
            </Link>
            <span className="text-gray-400 select-none">›</span>
          </li>
          <li
            className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md"
            title={category}
            aria-current="page"
          >
            {category}
          </li>
        </ol>
      </nav>
    </>
  );
}

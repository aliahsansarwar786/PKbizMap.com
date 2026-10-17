'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import BusinessCard from './BusinessCard';
import { businessAPI } from '@/lib/api';

export default function RecentlyListed() {
  const searchParams = useSearchParams();
  const rawCountry = searchParams?.get('country') || '';
  const country = rawCountry.trim();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    const params = {
      limit: 8,
      sort: '-createdAt',
    };

    if (country && country.toLowerCase() !== 'all') {
      params.country = country;
    }

    businessAPI
      .getAll(params)
      .then((res) => {
        if (!canceled) {
          const list = res.data?.businesses || [];
          setBusinesses(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load recently listed businesses:', err);
        if (!canceled) {
          setBusinesses([]);
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [country]);

  // If there are zero approved listings (or while still loading initial listings),
  // hide the entire section (show nothing, no empty boxes).
  if (businesses.length === 0) {
    return null;
  }

  const isFilteredCountry = Boolean(country && country.toLowerCase() !== 'all');
  const viewAllHref = isFilteredCountry
    ? `/businesses?country=${encodeURIComponent(country)}`
    : '/businesses';

  return (
    <section
      className="section bg-white border-t border-slate-100"
      aria-labelledby="recently-listed-heading"
    >
      <div className="container-max">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2.5 border border-blue-100/60">
              <Sparkles size={13} className="text-blue-600" />
              <span>Fresh Additions</span>
            </div>
            <h2
              id="recently-listed-heading"
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              Recently Listed
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-1.5 max-w-xl">
              Discover the latest verified businesses recently added to our directory
              {isFilteredCountry ? ` in ${country}` : ''}.
            </p>
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0 group self-start sm:self-auto"
          >
            <span>View All Businesses</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Responsive Business Cards Grid (1 col on 360px/390px mobile, 2 cols on tablet, 4 cols on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businesses.map((business) => (
            <BusinessCard key={business._id} business={business} />
          ))}
        </div>
      </div>
    </section>
  );
}

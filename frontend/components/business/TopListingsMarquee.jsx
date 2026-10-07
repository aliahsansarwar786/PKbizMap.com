'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { businessAPI } from '@/lib/api';

export default function TopListingsMarquee() {
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    // Fetch top rated businesses
    businessAPI.getAll({ limit: 10, sort: '-createdAt' })
      .then(res => {
        // If there are only a few businesses, duplicate them more times to fill the screen
        let fetched = res.data.businesses || [];
        if (fetched.length > 0 && fetched.length < 5) {
          fetched = [...fetched, ...fetched, ...fetched, ...fetched];
        } else if (fetched.length > 0) {
           fetched = [...fetched, ...fetched];
        }
        setBusinesses(fetched);
      })
      .catch(() => {});
  }, []);

  if (!businesses.length) return null;

  return (
    <section className="py-16" style={{ background: '#f8fafc' }} aria-labelledby="top-listings-heading">
      <div className="container-max text-center mb-8">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          FEATURED
        </span>
        <h2 id="top-listings-heading" style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginTop: '0.25rem' }}>
          Our Top Listings
        </h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', maxWidth: 600, margin: '0.5rem auto 0' }}>
          Discover the most trusted and highly-rated businesses, handpicked for their excellence.
        </p>
      </div>

      <div className="w-full overflow-hidden relative flex items-center py-4">
        {/* Gradient fades for smooth edges */}
        <div className="absolute left-0 w-24 h-full z-10" style={{ background: 'linear-gradient(to right, #f8fafc, transparent)' }}></div>
        <div className="absolute right-0 w-24 h-full z-10" style={{ background: 'linear-gradient(to left, #f8fafc, transparent)' }}></div>
        
        <div 
          className="flex gap-5 animate-marquee hover:pause-animation"
          style={{ width: 'max-content' }}
        >
          {businesses.map((biz, idx) => {
            const img = biz.images?.[0]?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.title)}&background=2563eb&color=fff`;
            return (
              <Link 
                key={`${biz._id}-${idx}`}
                href={`/businesses/${biz._id}`}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow min-w-[300px]"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#f3f4f6' }}>
                  <Image src={img} alt={biz.title} width={56} height={56} className="object-cover w-full h-full" />
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{biz.title}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {[biz.address?.city, biz.category].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="text-center mt-8">
        <Link 
          href="/businesses" 
          className="inline-flex items-center justify-center font-bold"
          style={{ background: '#ea580c', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.9375rem', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = '#c2410c'}
          onMouseOut={(e) => e.currentTarget.style.background = '#ea580c'}
        >
          View All Listings
        </Link>
      </div>
    </section>
  );
}

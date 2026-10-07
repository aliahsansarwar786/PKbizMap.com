'use client';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight, BadgeCheck } from 'lucide-react';

// Star rating component
export function StarRating({ rating = 0, count = 0, size = 14 }) {
  const filled = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= filled ? '#eab308' : star === filled + 1 && hasHalf ? 'url(#half)' : '#e2e8f0'}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="50%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs font-medium text-slate-500">
          {rating.toFixed(1)} <span className="text-slate-400">({count})</span>
        </span>
      )}
    </div>
  );
}

// Premium Business Card
export default function BusinessCard({ business }) {
  const firstImage = business.images?.[0]?.url;
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.title)}&background=0ea5e9&color=fff&size=400&bold=true&format=png`;

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        <Image
          src={firstImage || defaultImage}
          alt={`${business.title} image`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Gradients for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-slate-900/10 pointer-events-none"></div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-blue-700 shadow-sm backdrop-blur-sm border border-white/20">
            {business.category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-5">
        
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h2 className="font-bold text-lg text-slate-900 leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
            {business.title}
          </h2>
          <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-slate-500 mb-3">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="text-sm font-medium truncate">
            {business.address?.city || 'Location not specified'}
          </span>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={business.averageRating || 0} count={business.reviewCount || 0} />
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6 flex-1">
          {business.description || 'No description available for this business.'}
        </p>

        {/* Action Button */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <Link
            href={`/businesses/${business._id}`}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-sm font-semibold transition-colors group/btn"
          >
            <span>View Details</span>
            <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center group-hover/btn:bg-blue-100 transition-colors">
              <ChevronRight size={14} className="text-slate-500 group-hover/btn:text-blue-600 group-hover/btn:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}

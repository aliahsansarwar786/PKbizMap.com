'use client';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, ChevronRight, BadgeCheck } from 'lucide-react';

// WhatsApp SVG Icon
function WhatsAppIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// 5-Star Rating component: filled per rating + "{rating} ({reviewCount} reviews)". No reviews → empty stars + "0.0 (0 reviews)"
export function StarRating({ rating = 0, count = 0, size = 14 }) {
  const numRating = Number(rating) || 0;
  const numCount = Number(count) || 0;
  const filled = Math.floor(numRating);
  const hasHalf = numRating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex gap-0.5" aria-label={`Rating: ${numRating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => {
          let fill = '#e2e8f0'; // empty star by default
          if (numCount > 0) {
            if (star <= filled) {
              fill = '#eab308';
            } else if (star === filled + 1 && hasHalf) {
              fill = 'url(#half-star)';
            }
          }

          return (
            <svg
              key={star}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={fill}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="half-star">
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-slate-700">
        {numRating.toFixed(1)}{' '}
        <span className="font-normal text-slate-400">({numCount} reviews)</span>
      </span>
    </div>
  );
}

// Reference-style Business Card
export default function BusinessCard({ business }) {
  const firstImage = business.images?.[0]?.url;
  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.title)}&background=0ea5e9&color=fff&size=400&bold=true&format=png`;

  const rating = business.rating ?? business.averageRating ?? 0;
  const reviewCount = business.reviewCount ?? 0;
  const cityName = business.address?.city || '';
  const countryName = business.address?.country || 'Pakistan';

  // Contact hrefs
  const rawPhone = business.phone || business.whatsapp || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const phoneHref = rawPhone.trim() ? `tel:${rawPhone.trim()}` : null;
  const whatsappTarget = cleanPhone || (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923106131361');
  const whatsappHref = `https://wa.me/${whatsappTarget}?text=${encodeURIComponent(
    `Hi, I found ${business.title} on BizPrimeHub and would like to inquire about your services.`
  )}`;

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={firstImage || defaultImage}
          alt={`${business.title} image`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        
        {/* Gradients for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/0 to-slate-900/10 pointer-events-none" />

        {/* Pill badges: CATEGORY pill + CITY pill at top of card (uppercase, small) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[calc(100%-1.5rem)]">
          {business.category && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs border border-blue-500/30">
              {business.category}
            </span>
          )}
          {cityName && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/95 text-slate-800 backdrop-blur-xs shadow-xs border border-white/40">
              {cityName}
            </span>
          )}
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
        <div className="flex items-center gap-1.5 text-slate-500 mb-2.5">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="text-sm font-medium truncate">
            {[cityName, countryName].filter(Boolean).join(', ') || 'Location not specified'}
          </span>
        </div>

        {/* Rating row: 5 stars + "{rating} ({reviewCount} reviews)" */}
        <div className="mb-3.5">
          <StarRating rating={rating} count={reviewCount} />
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5 flex-1">
          {business.description || 'No description available for this business.'}
        </p>

        {/* Action Buttons: WhatsApp / Call / View Details */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp button */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 hover:border-emerald-600 transition-colors duration-200 min-h-[44px]"
              aria-label={`Chat on WhatsApp with ${business.title}`}
            >
              <WhatsAppIcon size={14} />
              <span>WhatsApp</span>
            </a>

            {/* Call button */}
            {phoneHref ? (
              <a
                href={phoneHref}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 hover:border-blue-600 transition-colors duration-200 min-h-[44px]"
                aria-label={`Call ${business.title}`}
              >
                <Phone size={13} />
                <span>Call</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200/60 cursor-not-allowed opacity-60 min-h-[44px]"
                aria-label="No phone number available"
              >
                <Phone size={13} />
                <span>Call</span>
              </button>
            )}
          </div>

          {/* View Details button */}
          <Link
            href={`/businesses/${business._id}`}
            className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 group/btn"
          >
            <span>View Details</span>
            <div className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center group-hover/btn:bg-slate-800 transition-colors">
              <ChevronRight
                size={14}
                className="text-slate-500 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all"
              />
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}


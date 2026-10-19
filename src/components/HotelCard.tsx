import React from 'react';
import { Hotel } from '../types';
import { Star, MapPin, Sparkles, ChevronRight } from 'lucide-react';

interface HotelCardProps {
  hotel: Hotel;
  onViewDetails: (hotel: Hotel) => void;
  onBookNow: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  onViewDetails,
  onBookNow,
}) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Hotel Image with subtle badges */}
      <div className="relative h-60 w-full overflow-hidden bg-slate-900">
        <img
          src={hotel.coverImage}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Floating Badge */}
        {hotel.featured && (
          <div className="absolute top-3 left-3 bg-[#0B132B]/85 backdrop-blur-md text-[#D4AF37] px-2.5 py-1 rounded text-xs font-semibold tracking-wider uppercase border border-[#D4AF37]/40 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            Featured Sanctuary
          </div>
        )}

        {/* Star Rating Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[#D4AF37]">
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
          ))}
          <span className="text-xs text-white/90 font-medium ml-1">
            {hotel.starRating}-Star Luxury
          </span>
        </div>

        {/* Guest rating badge */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-[#0B132B] flex items-center gap-1 shadow">
          <span className="text-[#D4AF37]">★</span>
          <span>{hotel.guestRating.toFixed(1)}</span>
          <span className="text-slate-400 font-normal">({hotel.reviewCount})</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Unboxed Metadata: City & Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{hotel.city}</span>
            <span aria-hidden="true">·</span>
            <span>{hotel.state}</span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-[#8C6D23] transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
            {hotel.tagline || hotel.description}
          </p>

          {/* Unboxed Amenities list */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <React.Fragment key={amenity}>
                <span>{amenity}</span>
                {i < Math.min(2, hotel.amenities.length - 1) && (
                  <span aria-hidden="true" className="text-slate-300">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pricing & CTA Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">From</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-bold text-[#0B132B]">
                ₹{hotel.priceStartingFrom.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
            </div>
            <span className="text-[10px] text-emerald-600 block font-medium">+ taxes & breakfast</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails(hotel)}
              className="px-3 py-2 text-xs font-semibold text-[#0B132B] hover:text-[#8C6D23] border border-slate-300 hover:border-[#D4AF37] rounded-lg transition cursor-pointer"
            >
              Details
            </button>
            <button
              onClick={() => onBookNow(hotel)}
              className="px-3.5 py-2 text-xs font-bold bg-[#0B132B] hover:bg-[#1C2541] text-[#D4AF37] rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <span>Book</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

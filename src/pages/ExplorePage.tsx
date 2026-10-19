import React, { useState, useEffect } from 'react';
import { Hotel } from '../types';
import { api } from '../services/api';
import { HotelCard } from '../components/HotelCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ExplorePageProps {
  initialCity?: string;
  onSelectHotel: (hotel: Hotel) => void;
  onBookHotel: (hotel: Hotel) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialCity,
  onSelectHotel,
  onBookHotel,
}) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });

  // Filters state
  const [city, setCity] = useState(initialCity || 'all');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [starRating, setStarRating] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number | ''>('');
  const [selectedAmenity, setSelectedAmenity] = useState('');
  const [sort, setSort] = useState('popularity');
  const [currentPage, setCurrentPage] = useState(1);

  // Available amenities for filtering
  const amenityOptions = [
    'Private Boat',
    'Spa',
    'Pool',
    'Beach',
    'Fine Dining',
    'Butler',
    'WiFi',
    'Fireplace',
    'Balcony',
  ];

  const fetchHotels = () => {
    setLoading(true);
    api
      .getHotels({
        city: city !== 'all' ? city : undefined,
        search: search.trim() || undefined,
        minPrice: minPrice !== '' ? Number(minPrice) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        starRating: starRating !== '' ? Number(starRating) : undefined,
        minRating: minRating !== '' ? Number(minRating) : undefined,
        amenity: selectedAmenity || undefined,
        sort,
        page: currentPage,
        limit: 9,
      })
      .then(res => {
        if (res.success && res.data) {
          setHotels(res.data);
          setPagination(res.pagination);
        }
      })
      .catch(err => console.error('Error fetching hotels:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHotels();
  }, [city, starRating, minRating, selectedAmenity, sort, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHotels();
  };

  const handleResetFilters = () => {
    setCity('all');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setStarRating('');
    setMinRating('');
    setSelectedAmenity('');
    setSort('popularity');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D23]">
          <Sparkles className="w-3.5 h-3.5" /> Curated Indian Stays
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0B132B]">
          Explore Luxury Hotels & Villas
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Filter through our verified collection of royal palaces, cliffside villas, and serene mountain chalets.
        </p>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by hotel, palace, or city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Find
          </button>
        </form>

        {/* Sort dropdown */}
        <div className="w-full md:w-auto flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-slate-500 font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={e => {
              setSort(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="popularity">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="px-2.5 py-2 text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#8C6D23]" /> Filter Properties
            </span>
            <span className="text-xs text-slate-400 font-medium">{pagination.total} found</span>
          </div>

          {/* City / Destination Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Destination City
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'Varanasi', 'Jaipur', 'Goa', 'Delhi', 'Mumbai', 'Agra', 'Manali', 'Bengaluru'].map(
                c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                      city === c
                        ? 'bg-[#0B132B] text-[#D4AF37] font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {c === 'all' ? 'All Cities' : c}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Hotel Star Category
            </label>
            <div className="flex gap-2">
              {[5, 4, 3].map(stars => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => {
                    setStarRating(starRating === stars ? '' : stars);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 py-1.5 px-2 text-xs rounded-lg border font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    starRating === stars
                      ? 'border-[#0B132B] bg-[#0B132B] text-[#D4AF37]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{stars}★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Rating Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Minimum Guest Rating
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[4.8, 4.5, 4.0].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => {
                    setMinRating(minRating === rating ? '' : rating);
                    setCurrentPage(1);
                  }}
                  className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                    minRating === rating
                      ? 'border-[#0B132B] bg-[#0B132B] text-white font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {rating}+ Exceptional
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nightly Price (INR)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchHotels();
              }}
              className="w-full mt-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Apply Price Filter
            </button>
          </div>

          {/* Amenities Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Signature Amenities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {amenityOptions.map(am => (
                <button
                  key={am}
                  type="button"
                  onClick={() => {
                    setSelectedAmenity(selectedAmenity === am ? '' : am);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-xs rounded-lg border transition cursor-pointer ${
                    selectedAmenity === am
                      ? 'border-[#0B132B] bg-[#0B132B] text-[#D4AF37] font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {am}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hotels Listing Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#8C6D23]" />
              <p className="text-sm font-medium">Loading verified luxury hotels...</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-[#8C6D23] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                No matching sanctuaries found
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                We couldn't find any hotels matching your current filter criteria. Try expanding your price range or clearing destination filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#0B132B] text-[#D4AF37] rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hotels.map(hotel => (
                  <HotelCard
                    key={hotel._id}
                    hotel={hotel}
                    onViewDetails={onSelectHotel}
                    onBookNow={onBookHotel}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentPage === i + 1
                            ? 'bg-[#0B132B] text-[#D4AF37]'
                            : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

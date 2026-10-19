import React, { useState, useEffect } from 'react';
import { Hotel, Offer } from '../types';
import { api } from '../services/api';
import { HotelCard } from '../components/HotelCard';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Shield,
  CreditCard,
  Headphones,
  CheckCircle,
  Tag,
  Copy,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string, param?: any) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onBookHotel: (hotel: Hotel) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectHotel,
  onBookHotel,
}) => {
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Search widget states
  const [destination, setDestination] = useState('');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(threeDaysLater);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // Fetch featured hotels dynamically from MongoDB backend API
    api
      .getHotels({ featured: true, limit: 6 })
      .then(res => {
        if (res.success && res.data) {
          setFeaturedHotels(res.data);
        }
      })
      .catch(err => console.error('Failed loading featured hotels:', err))
      .finally(() => setLoadingHotels(false));

    // Fetch active offers
    api
      .getOffers()
      .then(res => {
        if (res.success && res.data) {
          setOffers(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('explore', {
      city: destination || 'all',
      checkIn,
      checkOut,
      guests,
      rooms,
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const popularDestinations = [
    { name: 'Varanasi', count: 'Heritage Ghats', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
    { name: 'Jaipur', count: 'Royal Palaces', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Goa', count: 'Cliffside Villas', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Delhi', count: 'Imperial Heritage', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80' },
    { name: 'Mumbai', count: 'Arabian Waterfront', img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Agra', count: 'Taj Mahal Panoramas', img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=600&q=80' },
    { name: 'Manali', count: 'Alpine Pine Chalets', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80' },
    { name: 'Bengaluru', count: 'Garden Palaces', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80' },
  ];

  const testimonials = [
    {
      name: 'Dr. Siddharth Sen & Family',
      role: 'Kolkata, India',
      hotel: 'Brijrama Heritage Palace, Varanasi',
      quote: 'The private boat transfer across the Ganga at twilight and the classical sitar recital in the palace courtyard was unmatched. ASVILLA verified booking ensured we had the best view suite without any surprises.',
      rating: 5,
    },
    {
      name: 'Maya & Alistair Ross',
      role: 'London, United Kingdom',
      hotel: 'The Rajvilas Oberoi, Jaipur',
      quote: 'Everything was seamless from our first click to checkout. The transparent pricing in rupees with GST clearly itemized gave us complete peace of mind. We will book all our Indian vacations through ASVILLA.',
      rating: 5,
    },
    {
      name: 'Devika Singhania',
      role: 'Mumbai, India',
      hotel: 'Villa Capella Azure Bay, Goa',
      quote: 'A truly private retreat overlooking the ocean cliffs. Room service was impeccable and the cancellation flexibility meant we felt safe booking well in advance.',
      rating: 5,
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 4.B Hero Section */}
      <section className="relative min-h-[640px] flex items-center justify-center pt-16 pb-24 px-4 overflow-hidden">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 bg-[#0B132B]">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=85"
            alt="ASVILLA Luxury Palace"
            className="w-full h-full object-cover opacity-35 scale-105 transform motion-safe:animate-pulse duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Premier Indian Luxury Hotel Collection</span>
          </div>

          <div className="space-y-4">
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
              Discover Your <span className="bg-gradient-to-r from-white via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent">Perfect Stay</span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-light leading-relaxed">
              Experience comfort, luxury, and unforgettable destinations with ASVILLA. Heritage palaces, clifftop villas, and secluded retreats.
            </p>
          </div>

          {/* Hotel Search Widget Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border border-slate-200 text-left text-slate-800 max-w-4xl mx-auto backdrop-blur-md">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Destination / City */}
              <div className="lg:col-span-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C5A059]" /> Destination / City
                </label>
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="">All Destinations</option>
                  <option value="Varanasi">Varanasi</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Goa">Goa</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Agra">Agra</option>
                  <option value="Manali">Manali</option>
                  <option value="Bengaluru">Bengaluru</option>
                </select>
              </div>

              {/* Check-in */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C5A059]" /> Check-in Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Check-out */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C5A059]" /> Check-out Date
                </label>
                <input
                  type="date"
                  required
                  min={checkIn}
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Guests & Rooms */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#C5A059]" /> Guests & Rooms
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={guests}
                    onChange={e => setGuests(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                  </select>
                  <select
                    value={rooms}
                    onChange={e => setRooms(Number(e.target.value))}
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value={1}>1 Room</option>
                    <option value={2}>2 Rooms</option>
                    <option value={3}>3 Rooms</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0B132B] font-bold rounded-lg shadow-md transition flex items-center justify-center gap-1.5 text-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 4.C Featured Hotels Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D23] mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Handpicked Sanctuaries
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0B132B]">
              Featured Luxury Hotels
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Properties meeting ASVILLA's stringent luxury comfort and architectural criteria.
            </p>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-sm font-semibold text-[#0B132B] hover:text-[#8C6D23] flex items-center gap-1 transition cursor-pointer self-start sm:self-auto"
          >
            <span>View All Hotels</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loadingHotels ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map(hotel => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                onViewDetails={onSelectHotel}
                onBookNow={onBookHotel}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4.D Popular Destinations Section */}
      <section className="bg-[#FAF8F5] py-16 border-y border-[#D4AF37]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D23] flex items-center justify-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Curated Indian Geography
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0B132B]">
              Popular Destinations
            </h2>
            <p className="text-sm text-slate-600">
              Explore royal heritage, tropical coastlines, and snow-capped Himalayan peaks.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularDestinations.map(dest => (
              <button
                key={dest.name}
                onClick={() => onNavigate('explore', { city: dest.name })}
                className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 text-left cursor-pointer"
              >
                <img
                  src={dest.img}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/90 via-[#0B132B]/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-heading font-bold text-lg sm:text-xl text-white group-hover:text-[#F3E5AB] transition-colors">
                    {dest.name}
                  </h3>
                  <span className="text-xs text-slate-300 block font-light">
                    {dest.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4.E Why Choose ASVILLA? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D23]">
            Uncompromising Standards
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0B132B]">
            Why Choose ASVILLA?
          </h2>
          <p className="text-sm text-slate-600">
            Engineered for discerning travellers who demand flawless stays and transparent reservations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Easy Hotel Reservations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Book the exact room type you desire in fewer than 60 seconds with instant confirmation and digital travel voucher generation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Secure Online Payments</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Powered by Razorpay India. Server-verified HMAC SHA-256 signatures, zero card storage, and PCI-DSS Grade A compliance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Verified Hotel Information</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every property is audited for genuine star ratings, authentic photography, accurate room sizes, and verified amenities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Transparent Pricing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zero hidden resort surcharges. Itemized room rates, 12% GST tax breakdowns, and immediate discounts before you pay.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Responsive Customer Support</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              24/7 dedicated concierge assistance via toll-free phone and live email for arrival coordination and special requests.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-[#D4AF37]/50 shadow-sm space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-900">Convenient Booking Management</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              View your reservations, download printable PDF vouchers, check refund statuses, or cancel eligible bookings with ease.
            </p>
          </div>
        </div>
      </section>

      {/* 4.F Special Offers & Promotional Discounts */}
      {offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-3xl p-8 sm:p-12 text-white border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Exclusive Member Privileges
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">
                Special Offers & Luxury Discounts
              </h2>
              <p className="text-sm text-slate-300">
                Apply these curated coupon codes at checkout to unlock guaranteed savings on palatial retreats and ocean villas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
              {offers.map(offer => (
                <div
                  key={offer._id}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-3 text-left hover:bg-white/15 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37] tracking-wider uppercase">
                      {offer.discountPercent}% Off
                    </span>
                    <span className="text-[10px] text-slate-400">Valid until {offer.validUntil}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{offer.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{offer.description}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <code className="bg-[#0B132B] text-[#D4AF37] px-3 py-1 rounded text-xs font-mono font-bold border border-[#D4AF37]/40">
                      {offer.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.code)}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold text-white flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4.G Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C6D23]">
            Verified Guest Voices
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0B132B]">
            Stories of Unforgettable Stays
          </h2>
          <p className="text-sm text-slate-600">
            Read authentic reviews from guests who booked their luxury journeys through ASVILLA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="font-heading font-bold text-sm text-slate-900 block">{t.name}</span>
                <span className="text-[11px] text-slate-500 block">{t.role}</span>
                <span className="text-[11px] text-[#8C6D23] font-medium block mt-1 truncate">
                  Stayed at: {t.hotel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

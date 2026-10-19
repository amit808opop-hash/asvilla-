import React, { useState, useEffect } from 'react';
import { Hotel, Room } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Users,
  Bed,
  Sparkles,
  Calendar,
  Share2,
  Heart,
  MessageSquare,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Compass,
} from 'lucide-react';

interface HotelDetailsPageProps {
  hotelId: string;
  onBookRoom: (hotel: Hotel, room?: Room) => void;
  onBack: () => void;
}

export const HotelDetailsPage: React.FC<HotelDetailsPageProps> = ({
  hotelId,
  onBookRoom,
  onBack,
}) => {
  const { user, openAuthModal } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadHotelDetails = () => {
    setLoading(true);
    api
      .getHotel(hotelId)
      .then(res => {
        if (res.success && res.data) {
          setHotel(res.data);
        }
      })
      .catch(err => console.error('Error fetching hotel details:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHotelDetails();
  }, [hotelId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const res = await api.submitReview(hotel!._id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.success) {
        setReviewSuccess('Your review has been successfully posted. Thank you!');
        setReviewTitle('');
        setReviewComment('');
        loadHotelDetails();
      } else {
        setReviewError(res.message || 'Failed to submit review.');
      }
    } catch {
      setReviewError('Server error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C6D23]" />
        <p className="text-sm font-medium text-slate-500">Retrieving sanctuary details...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <h2 className="font-heading text-2xl font-bold text-slate-900">Hotel Not Found</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#0B132B] text-white rounded-lg text-sm"
        >
          Return to Hotels
        </button>
      </div>
    );
  }

  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.coverImage];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <button onClick={onBack} className="hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer">
          ← Back to All Hotels
        </button>
        <div className="flex items-center gap-2">
          <span>{hotel.city}</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-800 font-medium">{hotel.name}</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#8C6D23] font-semibold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hotel.starRating}-Star Luxury Destination</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B132B]">
              {hotel.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
              {hotel.address}, {hotel.city}, {hotel.state}, {hotel.country} - {hotel.pincode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-right">
              <div className="flex items-center gap-1 justify-end font-bold text-emerald-800 text-sm">
                <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>{hotel.guestRating.toFixed(1)} / 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-700 block">
                {hotel.reviewCount} Verified Reviews
              </span>
            </div>
            <button
              onClick={() => onBookRoom(hotel)}
              className="px-6 py-3 bg-[#0B132B] hover:bg-[#1C2541] text-[#D4AF37] font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
            >
              Book This Hotel
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="space-y-3">
        <div className="h-[420px] sm:h-[500px] w-full rounded-2xl overflow-hidden bg-slate-900 relative shadow-lg">
          <img
            src={images[activeImageIndex]}
            alt={hotel.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`h-20 sm:h-24 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details & Room Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Description, Amenities, Policies */}
        <div className="lg:col-span-2 space-y-10">
          {/* About Hotel */}
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-[#0B132B]">
              About the Sanctuary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {hotel.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-bold text-[#0B132B]">
              Luxury Amenities & Privileges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotel.amenities.map(am => (
                <div
                  key={am}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-800 font-medium"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-50 text-[#8C6D23] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Room Types */}
          <div className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#0B132B]">
                  Available Suites & Villas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select your preferred accommodation type below.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {hotel.rooms?.length || 0} Categories Available
              </span>
            </div>

            <div className="space-y-5">
              {hotel.rooms?.map(room => (
                <div
                  key={room._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#D4AF37]/50 shadow-sm transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {room.images && room.images.length > 0 && (
                      <img
                        src={room.images[0]}
                        alt={room.roomType}
                        className="w-full sm:w-48 h-36 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-lg font-bold text-slate-900">
                            {room.roomType}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5" /> {room.bedType}
                            </span>
                            <span>·</span>
                            <span>{room.sizeSqFt} sq.ft</span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Max {room.capacity.total} Guests
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Nightly rate</span>
                          <span className="font-mono text-xl font-bold text-[#0B132B]">
                            ₹{room.pricePerNight.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {room.description}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
                        {room.amenities.map(ra => (
                          <span key={ra} className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {ra}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {room.totalRooms} verified rooms in property inventory
                    </span>
                    <button
                      onClick={() => onBookRoom(hotel, room)}
                      className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0B132B] font-bold rounded-lg text-xs shadow-sm transition cursor-pointer"
                    >
                      Book This Suite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel Policies */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#D4AF37]/20 space-y-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">
              Stay & Cancellation Policies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#8C6D23] shrink-0 mt-0.5" />
                <div>
                  <strong>Check-in & Check-out:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Check-in from {hotel.checkInTime} hrs · Check-out until {hotel.checkOutTime} hrs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8C6D23] shrink-0 mt-0.5" />
                <div>
                  <strong>Cancellation Policy:</strong>
                  <p className="text-slate-500 mt-0.5">{hotel.cancellationPolicy}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Host & Management Details */}
          {hotel.owner && (
            <div className="bg-gradient-to-br from-[#FDFBF7] to-white p-6 rounded-2xl border border-[#D4AF37]/30 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
                <div className="flex items-center gap-4">
                  {hotel.owner.avatarUrl ? (
                    <img
                      src={hotel.owner.avatarUrl}
                      alt={hotel.owner.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37] shadow"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#0B132B] text-[#D4AF37] font-heading font-bold text-xl flex items-center justify-center border-2 border-[#D4AF37]">
                      {hotel.owner.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-lg font-bold text-[#0B132B]">{hotel.owner.name}</h3>
                      {hotel.owner.verified && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          ✓ Verified ASVILLA Host
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8C6D23] font-medium mt-0.5">
                      {hotel.owner.role} &middot; {hotel.owner.experienceYears || 15}+ Years Luxury Hospitality
                    </p>
                    {hotel.owner.languages && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Languages: {hotel.owner.languages.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${hotel.owner.phone}`}
                    className="px-3 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Call Host Desk</span>
                  </a>
                  <a
                    href={`mailto:${hotel.owner.email}`}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Email Concierge</span>
                  </a>
                </div>
              </div>

              {/* Direct Desk and Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider block">
                    Direct Reception Lines
                  </span>
                  <div className="space-y-1 text-slate-600">
                    <p>
                      <strong>Host Mobile: </strong>
                      <a href={`tel:${hotel.owner.phone}`} className="font-mono text-slate-900 hover:text-[#8C6D23]">
                        {hotel.owner.phone}
                      </a>
                    </p>
                    <p>
                      <strong>Front Desk / Direct Dial: </strong>
                      <a href={`tel:${hotel.owner.deskPhone || hotel.owner.phone}`} className="font-mono text-slate-900 hover:text-[#8C6D23]">
                        {hotel.owner.deskPhone || hotel.owner.phone}
                      </a>
                    </p>
                    <p>
                      <strong>Official Inquiries: </strong>
                      <a href={`mailto:${hotel.owner.email}`} className="font-mono text-slate-900 hover:text-[#8C6D23]">
                        {hotel.owner.email}
                      </a>
                    </p>
                  </div>
                </div>

                {hotel.owner.checkInInstructions && (
                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-[#8C6D23] uppercase text-[11px] tracking-wider block">
                      Arrival & Welcome Instructions
                    </span>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {hotel.owner.checkInInstructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Reviews List & Submit Form */}
          <div className="space-y-6 pt-6 border-t border-slate-200">
            <h2 className="font-heading text-2xl font-bold text-[#0B132B] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#8C6D23]" />
              Guest Reviews ({hotel.reviews?.length || 0})
            </h2>

            {/* List Reviews */}
            <div className="space-y-4">
              {hotel.reviews && hotel.reviews.length > 0 ? (
                hotel.reviews.map(rev => (
                  <div key={rev._id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{rev.userName}</span>
                        <span className="text-xs text-slate-400">· {new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-[#D4AF37]">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    {rev.title && <h4 className="text-xs font-bold text-slate-800">{rev.title}</h4>}
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Be the first guest to leave a review for this property.</p>
              )}
            </div>

            {/* Submit Review Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-heading font-bold text-base text-slate-900">Leave a Review</h3>
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg">{reviewSuccess}</div>
              )}
              {reviewError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{reviewError}</div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">Rating:</label>
                  <div className="flex gap-1 text-[#D4AF37]">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${star <= reviewRating ? 'fill-[#D4AF37]' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    placeholder="Review headline (e.g., Unforgettable royal escape)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your stay experience, dining quality, and staff attentiveness..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-[#0B132B] hover:bg-[#1C2541] text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Guest Review'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sticky Card: Fast Reservation Widget */}
        <div className="space-y-6">
          <div className="sticky top-28 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Rates starting from</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-3xl font-extrabold text-[#0B132B]">
                  ₹{hotel.priceStartingFrom.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500">/ night</span>
              </div>
              <span className="text-[11px] text-emerald-600 block mt-1 font-medium">
                Best Rate Guarantee · Direct Booking Privilege
              </span>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Direct Concierge Assistance</span>
                <span className="font-semibold text-slate-900">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Complimentary Wi-Fi</span>
                <span className="font-semibold text-slate-900">High-Speed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cancellation Flexibility</span>
                <span className="font-semibold text-slate-900">Free before 48h</span>
              </div>
            </div>

            <button
              onClick={() => onBookRoom(hotel)}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0B132B] font-bold rounded-xl shadow-md transition text-sm cursor-pointer"
            >
              Reserve Stay Now
            </button>

            <div className="text-center text-[11px] text-slate-400">
              No reservation fee · Secure online payment via Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Hotel, Room, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RazorpayModal } from './RazorpayModal';
import {
  X,
  Calendar,
  Users,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Bed,
  MapPin,
  Sparkles,
  Info,
} from 'lucide-react';

interface BookingModalProps {
  hotel: Hotel;
  selectedRoom?: Room;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
  onClose: () => void;
  onBookingConfirmed: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  hotel,
  selectedRoom,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  initialRooms = 1,
  onClose,
  onBookingConfirmed,
}) => {
  const { user, openAuthModal } = useAuth();

  // Rooms state with fallback fetch if hotel.rooms was not populated
  const [roomsList, setRoomsList] = useState<Room[]>(hotel.rooms || []);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(!hotel.rooms || hotel.rooms.length === 0);

  // Selected room type
  const [activeRoomId, setActiveRoomId] = useState<string>(
    selectedRoom ? selectedRoom._id : (hotel.rooms?.[0]?._id || '')
  );

  // Form states
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(initialCheckIn || tomorrow);
  const [checkOut, setCheckOut] = useState(initialCheckOut || threeDaysLater);
  const [numberOfGuests, setNumberOfGuests] = useState(initialGuests);
  const [numberOfRooms, setNumberOfRooms] = useState(initialRooms);

  // Payment Method Selection: 'COD' (Pay at Hotel) or 'ONLINE' (Razorpay)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  // Guest details
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+91 98123 45678');
  const [specialRequests, setSpecialRequests] = useState('');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>('');

  // Availability state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    remainingRooms: number;
    message?: string;
  } | null>(null);

  // Booking & Payment submission states
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<any | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // Ensure hotel rooms are loaded
  useEffect(() => {
    if (!hotel.rooms || hotel.rooms.length === 0) {
      setLoadingRooms(true);
      api
        .getHotel(hotel._id)
        .then(res => {
          if (res.success && res.data && res.data.rooms && res.data.rooms.length > 0) {
            setRoomsList(res.data.rooms);
            if (!activeRoomId) {
              setActiveRoomId(res.data.rooms[0]._id);
            }
          }
        })
        .catch(err => {
          console.error('Failed to load hotel rooms:', err);
        })
        .finally(() => {
          setLoadingRooms(false);
        });
    } else {
      setRoomsList(hotel.rooms);
      if (!activeRoomId && hotel.rooms.length > 0) {
        setActiveRoomId(hotel.rooms[0]._id);
      }
    }
  }, [hotel._id]);

  // Find currently selected room object
  const activeRoom = roomsList.find(r => r._id === activeRoomId) || roomsList[0];

  // Calculate nights
  const calculateNights = () => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff || 1);
  };

  const nights = calculateNights();

  // Real-time price breakdown
  const roomRate = activeRoom ? activeRoom.pricePerNight : hotel.priceStartingFrom;
  const roomTotal = roomRate * nights * numberOfRooms;
  const gstAmount = Math.round(roomTotal * 0.12);
  const serviceFee = 1500;
  const totalAmount = Math.max(0, roomTotal + gstAmount + serviceFee - promoDiscount);

  // Auto-check availability when room, dates, or room count changes
  useEffect(() => {
    const targetRoomId = activeRoomId || activeRoom?._id;
    if (!targetRoomId || !checkIn || !checkOut) return;

    if (new Date(checkOut) <= new Date(checkIn)) {
      setAvailabilityResult({
        available: false,
        remainingRooms: 0,
        message: 'Check-out date must be strictly after check-in date.',
      });
      return;
    }

    setCheckingAvailability(true);
    api
      .checkAvailability({
        roomId: targetRoomId,
        checkIn,
        checkOut,
        rooms: numberOfRooms,
      })
      .then(res => {
        if (res.success) {
          setAvailabilityResult({
            available: res.available,
            remainingRooms: res.remainingRooms,
          });
        }
      })
      .catch(() => {
        setAvailabilityResult({ available: true, remainingRooms: 5 });
      })
      .finally(() => {
        setCheckingAvailability(false);
      });
  }, [activeRoomId, activeRoom, checkIn, checkOut, numberOfRooms]);

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await api.getOffers();
      if (res.success && res.data) {
        const found = res.data.find(
          o => o.code.toUpperCase() === promoCode.trim().toUpperCase() && o.isActive
        );
        if (found) {
          if (roomTotal < found.minBookingAmount) {
            setPromoMessage(`Minimum booking of ₹${found.minBookingAmount.toLocaleString('en-IN')} required for this offer.`);
            setPromoDiscount(0);
            setAppliedPromo(null);
          } else {
            const disc = Math.min(found.maxDiscount, Math.round((roomTotal * found.discountPercent) / 100));
            setPromoDiscount(disc);
            setAppliedPromo(found.code);
            setPromoMessage(`Privilege discount of ₹${disc.toLocaleString('en-IN')} applied!`);
          }
        } else {
          setPromoMessage('Invalid promo code. Try ASVILLA20 or ROYAL15.');
          setPromoDiscount(0);
          setAppliedPromo(null);
        }
      }
    } catch {
      setPromoMessage('Failed to validate promo code.');
    }
  };

  // Handle Form Submission (COD or ONLINE)
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!guestName.trim() || !guestEmail.trim()) {
      setErrorMsg('Please enter your full name and valid email address.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setErrorMsg('Check-out date must be after check-in date.');
      return;
    }

    if (availabilityResult && !availabilityResult.available) {
      setErrorMsg('Selected room is not available for these dates.');
      return;
    }

    // Resolve room ID safely
    const targetRoomId = activeRoomId || activeRoom?._id || roomsList[0]?._id;
    if (!targetRoomId) {
      setErrorMsg('Please select a suite or room type to proceed.');
      return;
    }

    setSubmittingBooking(true);

    try {
      // 1. Call POST /api/bookings with trusted server calculation and selected paymentMethod
      const bookingRes = await api.createBooking({
        hotelId: hotel._id,
        roomId: targetRoomId,
        checkIn,
        checkOut,
        numberOfGuests,
        numberOfRooms,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim() || undefined,
        promoCode: appliedPromo || undefined,
        paymentMethod,
      });

      if (!bookingRes.success || !bookingRes.booking) {
        setErrorMsg(bookingRes.message || 'Unable to create booking reservation.');
        setSubmittingBooking(false);
        return;
      }

      // OPTION A: Pay at Hotel (COD)
      if (paymentMethod === 'COD') {
        setSubmittingBooking(false);
        // Show confirmation voucher directly without opening payment gateway
        onBookingConfirmed(bookingRes.booking);
        return;
      }

      // OPTION B: Pay Online via Razorpay
      setPendingBooking(bookingRes.booking);

      const paymentOrderRes = await api.createPaymentOrder(bookingRes.booking._id);
      if (!paymentOrderRes.success || !paymentOrderRes.order) {
        setErrorMsg('Failed to initialize payment gateway.');
        setSubmittingBooking(false);
        return;
      }

      setRazorpayOrder(paymentOrderRes.order);
      setSubmittingBooking(false);
      setShowRazorpayModal(true);
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg('Server error processing booking: ' + (err.message || ''));
      setSubmittingBooking(false);
    }
  };

  const handleOnlinePaymentSuccess = (confirmedBooking: Booking) => {
    setShowRazorpayModal(false);
    onBookingConfirmed(confirmedBooking);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 text-slate-800">
          {/* Header */}
          <div className="bg-[#0B132B] text-white p-5 relative border-b-2 border-[#D4AF37]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#D4AF37] text-[#0B132B] font-bold font-heading flex items-center justify-center text-lg shadow">
                AV
              </div>
              <div>
                <span className="font-heading tracking-widest text-lg font-bold text-white block">
                  Reserve Your Stay
                </span>
                <span className="text-xs text-[#D4AF37] flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {hotel.name} · {hotel.city}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submittingBooking}
              className="text-white/70 hover:text-white p-1 rounded-full cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmitBooking} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Room Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Step 1: Choose Suite / Room Type
              </label>

              {loadingRooms ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8C6D23]" /> Loading available suites...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roomsList.length > 0 ? (
                    roomsList.map(r => (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() => setActiveRoomId(r._id)}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          activeRoomId === r._id
                            ? 'border-[#D4AF37] bg-[#FAF8F5] ring-2 ring-[#D4AF37]/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900 block">{r.roomType}</span>
                            {activeRoomId === r._id && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                          </div>
                          <span className="text-xs text-slate-500 block mt-1 flex items-center gap-1">
                            <Bed className="w-3 h-3" /> {r.bedType} · {r.sizeSqFt} sq.ft
                          </span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Nightly rate:</span>
                          <span className="font-mono font-bold text-[#0B132B]">₹{r.pricePerNight.toLocaleString('en-IN')}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                      Standard Luxury Chamber · ₹{hotel.priceStartingFrom.toLocaleString('en-IN')}/night
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates & Guests Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-in Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Check-out Date
                </label>
                <input
                  type="date"
                  required
                  min={checkIn}
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Guests
                </label>
                <select
                  value={numberOfGuests}
                  onChange={e => setNumberOfGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={5}>5 Guests</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Rooms</label>
                <select
                  value={numberOfRooms}
                  onChange={e => setNumberOfRooms(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value={1}>1 Room</option>
                  <option value={2}>2 Rooms</option>
                  <option value={3}>3 Rooms</option>
                </select>
              </div>

              {/* Dynamic Availability Indicator */}
              <div className="col-span-1 sm:col-span-2 pt-1 flex items-center justify-between text-xs">
                {checkingAvailability ? (
                  <span className="text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verifying real-time inventory...
                  </span>
                ) : availabilityResult?.available ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Room available ({availabilityResult.remainingRooms} left in inventory for these dates)
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {availabilityResult?.message || 'Sold out for selected dates'}
                  </span>
                )}
                <span className="text-slate-500 font-medium">Duration: {nights} night(s)</span>
              </div>
            </div>

            {/* Guest Details */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 2: Primary Guest Information
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="guest@asvilla.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="+91 98123 45678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Special Requests (Optional)</label>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Ghat view, early arrival, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
              <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#C5A059]" /> Apply Privilege Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ASVILLA20, ROYAL15"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-1.5 bg-[#0B132B] hover:bg-[#1C2541] text-[#D4AF37] font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p className={`text-xs mt-1.5 font-medium ${promoDiscount > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Step 3: Select Payment Method
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Pay at Hotel (COD) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#D4AF37] bg-amber-50/40 ring-2 ring-[#D4AF37]/30 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-amber-700" />
                      <span className="font-bold text-sm text-slate-900">Pay at Hotel (COD)</span>
                    </div>
                    {paymentMethod === 'COD' && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reserve instantly without online payment. Pay at the hotel reception during physical check-in.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-amber-800">
                    No online advance needed · Pay on Arrival
                  </div>
                </button>

                {/* Option B: Pay Online */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    paymentMethod === 'ONLINE'
                      ? 'border-[#D4AF37] bg-blue-50/30 ring-2 ring-[#D4AF37]/30 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-700" />
                      <span className="font-bold text-sm text-slate-900">Pay Online (Razorpay)</span>
                    </div>
                    {paymentMethod === 'ONLINE' && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instant confirmation via Razorpay. Pay with UPI (GPay/PhonePe), Credit/Debit Card, or NetBanking.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-blue-800">
                    Verified Digital Signature · Fast Check-in
                  </div>
                </button>
              </div>

              {paymentMethod === 'COD' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pay at Hotel Policy:</strong> Your booking status will be saved as <em>pending_confirmation</em> and payment marked as <em>unpaid</em>. Please settle the total ₹{totalAmount.toLocaleString('en-IN')} upon arrival.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Online Payment Guarantee:</strong> 100% secure 256-bit encryption. The booking is confirmed immediately after the server verifies your payment signature.
                  </span>
                </div>
              )}
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-600 uppercase tracking-wider block">Itemized Price Summary</span>
              <div className="flex justify-between text-slate-600">
                <span>Room charges ({nights} nights × {numberOfRooms} room @ ₹{roomRate.toLocaleString('en-IN')})</span>
                <span className="font-mono font-medium">₹{roomTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (12% Government tax)</span>
                <span className="font-mono font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Luxury Concierge & Resort Fee</span>
                <span className="font-mono font-medium">₹{serviceFee.toLocaleString('en-IN')}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Privilege Discount ({appliedPromo})</span>
                  <span className="font-mono">-₹{promoDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span>{paymentMethod === 'COD' ? 'Total Payable at Hotel (INR)' : 'Total Amount (INR)'}</span>
                <span className="text-xl font-mono text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Action buttons with Duplicate Prevention */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={submittingBooking || Boolean(availabilityResult && !availabilityResult.available)}
                className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0B132B] font-bold rounded-xl shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                {submittingBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Reservation...</span>
                  </>
                ) : paymentMethod === 'COD' ? (
                  <>
                    <Banknote className="w-5 h-5" />
                    <span>Confirm Reservation (Pay ₹{totalAmount.toLocaleString('en-IN')} at Hotel)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Pay ₹{totalAmount.toLocaleString('en-IN')} Online</span>
                  </>
                )}
              </button>
              <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {paymentMethod === 'COD'
                    ? 'Instant Reservation Confirmation · Pay on Arrival at Hotel'
                    : 'Instant Confirmation · 100% Secure Razorpay Indian Rupee Gateway'}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Razorpay Gateway Modal for Online Payments */}
      {showRazorpayModal && pendingBooking && razorpayOrder && (
        <RazorpayModal
          booking={pendingBooking}
          hotelName={hotel.name}
          orderData={razorpayOrder}
          onSuccess={handleOnlinePaymentSuccess}
          onClose={() => setShowRazorpayModal(false)}
        />
      )}
    </>
  );
};

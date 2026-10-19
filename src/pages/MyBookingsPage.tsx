import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VoucherModal } from '../components/VoucherModal';
import { EmailPreviewModal } from '../components/EmailPreviewModal';
import {
  Calendar,
  MapPin,
  Printer,
  Ban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronRight,
  Mail,
  Phone,
  Send,
  X,
  ShieldCheck,
} from 'lucide-react';

interface MyBookingsPageProps {
  onExploreHotels: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onExploreHotels }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<Booking | null>(null);
  const [emailPreviewBooking, setEmailPreviewBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of travel schedule.');
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    api
      .getMyBookings()
      .then(res => {
        if (res.success && res.data) {
          setBookings(res.data);
        }
      })
      .catch(err => console.error('Error fetching bookings:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancellingId(cancelModalBooking._id);

    try {
      const res = await api.cancelBooking(cancelModalBooking._id, cancelReason);
      if (res.success) {
        setCancelModalBooking(null);
        setToastMessage(`Booking ${cancelModalBooking.bookingReference} has been cancelled.`);
        fetchBookings();
      } else {
        setToastMessage(res.message || 'Unable to cancel booking.');
      }
    } catch {
      setToastMessage('Server error cancelling booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleResendEmail = async (b: Booking) => {
    setResendingId(b._id);
    try {
      const res = await api.resendBookingEmail(b._id);
      if (res.success) {
        setToastMessage(`✓ Confirmation email resent to ${b.guestEmail}!`);
      } else {
        setToastMessage(`Failed to send email: ${res.message}`);
      }
    } catch {
      setToastMessage('Error dispatching email notification.');
    } finally {
      setResendingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeFilter === 'confirmed')
      return b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_confirmation';
    if (activeFilter === 'cancelled') return b.bookingStatus === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification Alert Banner */}
      {toastMessage && (
        <div className="p-4 bg-[#0B132B] text-white rounded-xl shadow-lg border-l-4 border-[#D4AF37] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8C6D23]">
            <Sparkles className="w-3.5 h-3.5" /> Guest Itinerary
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#0B132B]">
            My Reservations & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your verified stays, view property host contact details, inspect email vouchers, or adjust your travel dates.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeFilter === 'confirmed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active & Confirmed
          </button>
          <button
            onClick={() => setActiveFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeFilter === 'cancelled'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8C6D23]" />
          <p className="text-sm text-slate-500">Retrieving your palatial reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-[#FAF8F5] text-[#8C6D23] rounded-2xl flex items-center justify-center mx-auto border border-[#D4AF37]/30">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-xl font-bold text-slate-900">
              No Stays Found in This Category
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active reservations matching the current filter. Explore our handpicked luxury
              villas and heritage palaces.
            </p>
          </div>
          <button
            onClick={onExploreHotels}
            className="px-6 py-2.5 bg-[#0B132B] hover:bg-[#1C2541] text-white font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Explore Hotels
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map(b => (
            <div
              key={b._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              {/* Card Header: Reference and Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-slate-100 px-3 py-1 rounded text-slate-800 border border-slate-200">
                    Ref: {b.bookingReference}
                  </span>
                  <span className="text-xs text-slate-400">
                    Booked on {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {b.paymentMethod === 'COD' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      Pay at Hotel (COD)
                    </span>
                  )}

                  {b.bookingStatus === 'confirmed' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed
                    </span>
                  )}

                  {b.bookingStatus === 'pending_confirmation' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Reserved (Pending Check-in)
                    </span>
                  )}

                  {b.bookingStatus === 'cancelled' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" />
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body: Hotel Image & Info */}
              <div className="flex flex-col md:flex-row gap-5">
                {b.hotelImage && (
                  <img
                    src={b.hotelImage}
                    alt={b.hotelName}
                    className="w-full md:w-56 h-44 object-cover rounded-xl"
                  />
                )}

                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#8C6D23] uppercase tracking-wider block">
                      {b.hotelCity}
                    </span>
                    <h3 className="font-heading text-xl font-bold text-slate-900">
                      {b.hotelName || 'ASVILLA Luxury Property'}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {b.hotelAddress || b.hotelCity}
                    </p>
                    <div className="text-xs text-slate-700 pt-1">
                      Suite: <strong>{b.roomType}</strong> ({b.numberOfRooms} Room, {b.numberOfGuests} Guests)
                    </div>
                  </div>

                  {/* Dates & Payment Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Check-in</span>
                      <strong className="text-slate-800 block mt-0.5">{b.checkIn}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Check-out</span>
                      <strong className="text-slate-800 block mt-0.5">{b.checkOut}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Total Amount</span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">
                        ₹{b.priceBreakdown.totalAmount.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Property Host Contact Details (Requested Owner Feature) */}
                  {b.hotelOwner && (
                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        {b.hotelOwner.avatarUrl ? (
                          <img
                            src={b.hotelOwner.avatarUrl}
                            alt={b.hotelOwner.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#0B132B] text-[#D4AF37] font-bold flex items-center justify-center text-xs">
                            {b.hotelOwner.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{b.hotelOwner.name}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1 rounded">
                              Host
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{b.hotelOwner.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${b.hotelOwner.phone}`}
                          className="px-2.5 py-1.5 bg-[#0B132B] text-white hover:bg-[#1C2541] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Phone className="w-3 h-3 text-[#D4AF37]" />
                          <span>Call Host</span>
                        </a>
                        <a
                          href={`mailto:${b.hotelOwner.email}`}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Action buttons (Voucher, Email Preview, Cancel) */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedBookingForVoucher(b)}
                        className="px-3.5 py-2 border border-slate-300 hover:border-[#D4AF37] rounded-lg text-xs font-semibold text-slate-800 hover:text-[#8C6D23] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#8C6D23]" />
                        <span>View Voucher / PDF</span>
                      </button>

                      <button
                        onClick={() => setEmailPreviewBooking(b)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="View official HTML confirmation email"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>Email Confirmation</span>
                      </button>

                      <button
                        onClick={() => handleResendEmail(b)}
                        disabled={resendingId === b._id}
                        className="px-3 py-2 text-slate-500 hover:text-slate-900 text-xs font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        title="Resend email to your inbox"
                      >
                        {resendingId === b._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Resend Email</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {(b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_confirmation') && (
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Cancel Reservation?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel booking{' '}
                <strong className="font-mono">{cancelModalBooking.bookingReference}</strong> at{' '}
                {cancelModalBooking.hotelName}?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200 space-y-1">
              <p className="font-semibold">Cancellation Policy:</p>
              <p className="text-[11px] text-amber-800">
                {cancelModalBooking.cancellationPolicy ||
                  'Free cancellation applies if cancelled before 48 hours.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
              >
                <option value="Change of travel schedule.">Change of travel schedule.</option>
                <option value="Found an alternative accommodation.">Found alternative accommodation.</option>
                <option value="Flight or train delays.">Transportation delays.</option>
                <option value="Personal emergency.">Personal emergency.</option>
                <option value="Other">Other reason.</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {cancellingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Voucher Modal */}
      {selectedBookingForVoucher && (
        <VoucherModal
          booking={selectedBookingForVoucher}
          onClose={() => setSelectedBookingForVoucher(null)}
        />
      )}

      {/* Email Preview Modal */}
      {emailPreviewBooking && (
        <EmailPreviewModal
          bookingId={emailPreviewBooking._id}
          bookingReference={emailPreviewBooking.bookingReference}
          guestEmail={emailPreviewBooking.guestEmail}
          onClose={() => setEmailPreviewBooking(null)}
        />
      )}
    </div>
  );
};

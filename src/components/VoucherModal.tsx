import React, { useState } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import { EmailPreviewModal } from './EmailPreviewModal';
import {
  CheckCircle2,
  Printer,
  X,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  Banknote,
  Sparkles,
  Clock,
  Mail,
  Phone,
  Send,
  Loader2,
  Compass,
} from 'lucide-react';

interface VoucherModalProps {
  booking: Booking;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ booking, onClose }) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await api.resendBookingEmail(booking._id);
      if (res.success) {
        setEmailStatusMsg(`Confirmation email successfully resent to ${booking.guestEmail}!`);
      } else {
        setEmailStatusMsg(res.message || 'Failed to resend confirmation email.');
      }
    } catch {
      setEmailStatusMsg('Server error sending confirmation email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const isCod = booking.paymentMethod === 'COD' || booking.paymentStatus === 'unpaid';
  const owner = booking.hotelOwner;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 text-slate-800 voucher-card">
          {/* Header / Brand */}
          <div className="bg-[#0B132B] text-white p-6 relative flex items-center justify-between border-b-4 border-[#D4AF37]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#D4AF37] flex items-center justify-center text-[#0B132B] font-bold font-heading text-xl">
                AV
              </div>
              <div>
                <span className="font-heading tracking-[0.2em] text-xl font-bold block text-white">
                  ASVILLA
                </span>
                <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase block">
                  Official Booking Confirmation Voucher
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Print voucher or save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-white/70 hover:text-white rounded-full cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Confirmation Banner */}
          <div
            className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isCod ? 'bg-amber-50/90 border-amber-200' : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                  isCod ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
              >
                {isCod ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <span className={`font-bold text-sm block ${isCod ? 'text-amber-950' : 'text-emerald-900'}`}>
                  {isCod ? 'Reservation Placed · Pay at Hotel (COD)' : 'Reservation Confirmed & Guaranteed'}
                </span>
                <span className={`text-xs ${isCod ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {isCod
                    ? 'Payment Due: ₹' +
                      booking.priceBreakdown.totalAmount.toLocaleString('en-IN') +
                      ' during physical check-in'
                    : 'Payment captured securely via Razorpay Gateway'}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Booking Reference</span>
              <span className="font-mono font-bold text-base text-[#0B132B] tracking-wider bg-white px-2.5 py-1 rounded border border-slate-200 inline-block mt-0.5">
                {booking.bookingReference}
              </span>
            </div>
          </div>

          {/* Email Notification Dispatch Status Bar */}
          <div className="bg-slate-900 text-white px-6 py-3 text-xs flex flex-wrap items-center justify-between gap-2 no-print border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                Confirmation email sent to <strong className="text-white font-mono">{booking.guestEmail}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailPreview(true)}
                className="px-2.5 py-1 bg-[#D4AF37] hover:bg-[#C5A059] text-[#0B132B] font-bold rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <span>Preview Email</span>
              </button>
              <button
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                {resendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Resend</span>
              </button>
            </div>
          </div>

          {/* Feedback message for resend */}
          {emailStatusMsg && (
            <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 no-print">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{emailStatusMsg}</span>
            </div>
          )}

          {/* COD Instruction Alert if applicable */}
          {isCod && (
            <div className="bg-amber-100/60 px-6 py-3 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Pay at Hotel Policy:</strong> Please present this booking voucher at the reception desk during
                check-in. You may pay using Cash, UPI, or Card at the hotel.
              </span>
            </div>
          )}

          {/* Content Body */}
          <div className="p-6 space-y-6">
            {/* Hotel & Stay Information */}
            <div className="flex flex-col sm:flex-row gap-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {booking.hotelImage && (
                <img
                  src={booking.hotelImage}
                  alt={booking.hotelName || 'ASVILLA Stay'}
                  className="w-full sm:w-36 h-28 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-1.5">
                <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider block">
                  Luxury Estate
                </span>
                <h3 className="font-heading text-lg font-bold text-slate-900">
                  {booking.hotelName || 'ASVILLA Heritage Property'}
                </h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {booking.hotelAddress || booking.hotelCity || 'India'}
                </p>
                <div className="pt-1 text-xs text-slate-700 font-medium">
                  Room: <span className="font-semibold text-slate-900">{booking.roomType || 'Deluxe Suite'}</span>
                </div>
              </div>
            </div>

            {/* Dates & Occupancy Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border border-slate-200 rounded-xl bg-white text-center">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase">Check-in</span>
                <span className="font-semibold text-sm text-slate-900 block mt-0.5">{booking.checkIn}</span>
                <span className="text-[10px] text-slate-400">From 14:00 hrs</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block uppercase">Check-out</span>
                <span className="font-semibold text-sm text-slate-900 block mt-0.5">{booking.checkOut}</span>
                <span className="text-[10px] text-slate-400">Until 12:00 hrs</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block uppercase">Total Stay</span>
                <span className="font-semibold text-sm text-slate-900 block mt-0.5">
                  {booking.priceBreakdown.nights} Nights
                </span>
                <span className="text-[10px] text-slate-400">{booking.numberOfRooms} Room(s)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block uppercase">Guests</span>
                <span className="font-semibold text-sm text-slate-900 block mt-0.5">
                  {booking.numberOfGuests} Guests
                </span>
                <span className="text-[10px] text-slate-400">Breakfast Included</span>
              </div>
            </div>

            {/* Property Host & Arrival Assistance (Requested Owner Details) */}
            {owner && (
              <div className="border border-[#D4AF37]/40 bg-[#FDFBF7] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {owner.avatarUrl ? (
                      <img
                        src={owner.avatarUrl}
                        alt={owner.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0B132B] text-[#D4AF37] font-bold flex items-center justify-center text-sm">
                        {owner.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{owner.name}</span>
                        {owner.verified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            ✓ Verified Host
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8C6D23] font-medium block">
                        {owner.role} &middot; {owner.experienceYears || 15}+ Yrs Hospitality
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:inline">
                    Direct Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#D4AF37]/20 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Direct Mobile:</span>
                    <a href={`tel:${owner.phone}`} className="font-semibold text-slate-900 hover:text-[#8C6D23]">
                      📞 {owner.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Reception Desk:</span>
                    <a href={`tel:${owner.deskPhone || owner.phone}`} className="font-semibold text-slate-900 hover:text-[#8C6D23]">
                      ☎️ {owner.deskPhone || owner.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Property Email:</span>
                    <a href={`mailto:${owner.email}`} className="font-semibold text-slate-900 hover:text-[#8C6D23] truncate block">
                      ✉️ {owner.email}
                    </a>
                  </div>
                </div>

                {owner.checkInInstructions && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900">Arrival Instructions: </strong>
                    {owner.checkInInstructions}
                  </div>
                )}
              </div>
            )}

            {/* Primary Guest Details */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guest Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Full Name:</span>
                  <span className="font-medium text-slate-900">{booking.guestName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Email Address:</span>
                  <span className="font-medium text-slate-900 truncate">{booking.guestEmail}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Contact Phone:</span>
                  <span className="font-medium text-slate-900">{booking.guestPhone || 'On File'}</span>
                </div>
              </div>
              {booking.specialRequests && (
                <div className="pt-2 text-xs text-slate-600 border-t border-slate-100 mt-2">
                  <strong>Special Request:</strong> {booking.specialRequests}
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
              <h4 className="font-bold text-slate-500 uppercase tracking-wider">Settlement & Charges</h4>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Room Charges ({booking.priceBreakdown.nights} nights × ₹
                    {booking.priceBreakdown.basePrice.toLocaleString('en-IN')})
                  </span>
                  <span className="font-mono">₹{booking.priceBreakdown.roomTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Goods & Services Tax (12% GST)</span>
                  <span className="font-mono">₹{booking.priceBreakdown.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resort Amenity & Heritage Preservation Fee</span>
                  <span className="font-mono">₹{booking.priceBreakdown.serviceFee.toLocaleString('en-IN')}</span>
                </div>
                {booking.priceBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Special Offer Discount ({booking.priceBreakdown.promoCode})</span>
                    <span className="font-mono">-₹{booking.priceBreakdown.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>{isCod ? 'Total Payable at Check-in (INR)' : 'Total Amount Paid (INR)'}</span>
                  <span className="font-mono text-emerald-700 text-base">
                    ₹{booking.priceBreakdown.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-1.5 font-mono">
                  {isCod ? (
                    <>
                      <Banknote className="w-3.5 h-3.5 text-amber-600" />
                      <span>Payment Method: Pay at Hotel (COD)</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Razorpay Txn: {booking.razorpayPaymentId || 'Verified Online'}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>
                    Payment Status: <strong className="uppercase">{booking.paymentStatus}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p>
              Please present this digital voucher or booking reference during hotel check-in along with
              government-issued photo ID.
            </p>
            <p className="text-[11px] text-slate-400">
              ASVILLA 24/7 Dedicated Concierge: reservations@asvilla.com · Toll Free: 1800 278 4552
            </p>
          </div>
        </div>
      </div>

      {/* Render Email Preview Modal if triggered */}
      {showEmailPreview && (
        <EmailPreviewModal
          bookingId={booking._id}
          bookingReference={booking.bookingReference}
          guestEmail={booking.guestEmail}
          onClose={() => setShowEmailPreview(false)}
        />
      )}
    </>
  );
};

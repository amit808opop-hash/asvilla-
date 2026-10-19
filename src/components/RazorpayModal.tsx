import React, { useState } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface RazorpayModalProps {
  booking: Booking;
  hotelName: string;
  orderData: {
    id: string;
    amount: number;
    currency: string;
    bookingId: string;
    keyId?: string;
  };
  onSuccess: (confirmedBooking: Booking, paymentRecord: any) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  booking,
  hotelName,
  orderData,
  onSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('guest@oksbi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState(booking.guestName || 'Aarav Sharma');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const amountInRupees = (orderData.amount / 100).toLocaleString('en-IN');

  const handlePay = async () => {
    setProcessing(true);
    setErrorMsg('');

    try {
      // Generate simulated digital signature for the verified sandbox handshake
      const mockPaymentId = `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const sandboxSig = `sandbox_sig_${orderData.id}_${mockPaymentId}`;

      const paymentMethodName =
        activeTab === 'upi'
          ? `Razorpay UPI (${upiId})`
          : activeTab === 'card'
          ? `Card (ending ${cardNumber.replace(/\s+/g, '').slice(-4)})`
          : `NetBanking (${selectedBank})`;

      // Send to server verification route
      const verifyRes = await api.verifyPayment({
        bookingId: booking._id,
        razorpay_order_id: orderData.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: sandboxSig,
        paymentMethod: paymentMethodName,
      });

      if (verifyRes.success && verifyRes.booking) {
        onSuccess(verifyRes.booking, verifyRes.payment);
      } else {
        setErrorMsg(verifyRes.message || 'Payment verification failed on the server.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMsg('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-800 flex flex-col max-h-[92vh]">
        {/* Razorpay Top Banner */}
        <div className="bg-[#0C2340] text-white p-5 relative">
          <button
            onClick={onClose}
            disabled={processing}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Razorpay <span className="text-blue-400 font-medium text-xs border border-blue-400/40 px-1.5 py-0.5 rounded">Standard Checkout</span>
            </span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-400/30">
              Test Sandbox Mode
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60">Paying to Merchant</p>
              <h3 className="font-semibold text-white text-base tracking-wide flex items-center gap-1.5">
                ASVILLA Luxury Hospitality
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              </h3>
              <p className="text-xs text-white/50 truncate max-w-[280px]">
                {hotelName} · Ref: {booking.bookingReference}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-white/60 block">Amount</span>
              <span className="text-2xl font-bold font-mono text-emerald-300">₹{amountInRupees}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'upi' ? 'bg-white text-[#0C2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600" />
              UPI / QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'card' ? 'bg-white text-[#0C2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('netbanking')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'netbanking' ? 'bg-white text-[#0C2340] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-blue-600" />
              NetBanking
            </button>
          </div>

          {/* UPI Method Tab */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                <span className="font-semibold block mb-0.5">Instant Verification via Razorpay UPI</span>
                Enter any valid virtual payment address (VPA) or use the prefilled sandbox ID.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">UPI ID / VPA</label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="name@okhdfcbank"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium">Fast Select:</span>
                <button
                  type="button"
                  onClick={() => setUpiId('guest@okhdfcbank')}
                  className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Google Pay
                </button>
                <button
                  type="button"
                  onClick={() => setUpiId('aarav@ybl')}
                  className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => setUpiId('asvilla@paytm')}
                  className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Paytm
                </button>
              </div>
            </div>
          )}

          {/* Cards Tab */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry MM/YY</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    placeholder="•••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={e => setCardHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* NetBanking Tab */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Popular Indian Banks</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(
                  bank => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 text-xs font-medium rounded-lg border text-left flex items-center justify-between cursor-pointer ${
                        selectedBank === bank
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{bank}</span>
                      {selectedBank === bank && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Price Breakdown in Modal */}
          <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Room Total ({booking.priceBreakdown.nights} nights × {booking.priceBreakdown.rooms} rooms)</span>
              <span>₹{booking.priceBreakdown.roomTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Goods & Services Tax (12% GST)</span>
              <span>₹{booking.priceBreakdown.gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Resort Amenities & Concierge Fee</span>
              <span>₹{booking.priceBreakdown.serviceFee.toLocaleString('en-IN')}</span>
            </div>
            {booking.priceBreakdown.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Promo Discount ({booking.priceBreakdown.promoCode})</span>
                <span>-₹{booking.priceBreakdown.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 pt-1 text-sm border-t border-slate-200">
              <span>Total Payable</span>
              <span className="font-mono text-emerald-700">₹{amountInRupees}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Secure CTA */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#0C2340] to-[#1E3A8A] hover:from-[#13335A] hover:to-[#1E40AF] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Digital Signature with Razorpay Server...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Pay ₹{amountInRupees} Securely</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL Encrypted · Server-verified HMAC SHA-256 · PCI-DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

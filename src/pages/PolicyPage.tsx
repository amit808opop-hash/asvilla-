import React from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, FileText, Lock } from 'lucide-react';

interface PolicyPageProps {
  policyType: string;
  onBack: () => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyType, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <button
        onClick={onBack}
        className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      {policyType === 'cancellation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 text-[#8C6D23] pb-3 border-b border-slate-100">
            <RefreshCw className="w-6 h-6" />
            <h1 className="font-heading text-2xl font-bold text-[#0B132B]">
              ASVILLA Guest Cancellation Policy
            </h1>
          </div>
          <p>
            At ASVILLA, we understand that plans evolve. We provide standardized, transparent cancellation guidelines across all partner sanctuaries.
          </p>
          <h3 className="font-heading font-bold text-base text-slate-900">1. Standard Luxury Stays</h3>
          <p>
            Unless explicitly specified otherwise on the individual hotel details page, reservations cancelled up to <strong>48 hours prior to local check-in time (14:00 hrs)</strong> are eligible for a 100% full refund to the original payment source.
          </p>
          <h3 className="font-heading font-bold text-base text-slate-900">2. Late Cancellations & No-Shows</h3>
          <p>
            Cancellations made within 48 hours of scheduled arrival or guest no-shows are subject to a retention charge equivalent to the first night's room charge plus applicable GST.
          </p>
          <h3 className="font-heading font-bold text-base text-slate-900">3. Non-Refundable Promotional Bookings</h3>
          <p>
            Certain seasonal flash rates or special holiday packages marked as "Non-Refundable" at the time of reservation cannot be cancelled or amended once confirmed.
          </p>
        </div>
      )}

      {policyType === 'refund' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 text-emerald-700 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="font-heading text-2xl font-bold text-[#0B132B]">
              Instant Refund Guarantee & Procedures
            </h1>
          </div>
          <p>
            All online transactions on ASVILLA are processed through Razorpay's PCI-DSS compliant payment gateway. When an eligible booking is cancelled through your "My Bookings" dashboard:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The refund request is immediately submitted to the banking gateway.</li>
            <li>For UPI payments (Google Pay, PhonePe, Paytm), refunds typically credit within 2 to 24 hours.</li>
            <li>For Credit and Debit cards, refunds reflect on your card statement within 3 to 5 banking days, subject to your card issuer's clearing cycle.</li>
            <li>A confirmation SMS and email containing the Razorpay refund transaction reference number is dispatched instantly upon cancellation.</li>
          </ul>
        </div>
      )}

      {policyType === 'terms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 text-slate-800 pb-3 border-b border-slate-100">
            <FileText className="w-6 h-6 text-[#8C6D23]" />
            <h1 className="font-heading text-2xl font-bold text-[#0B132B]">
              Terms & Conditions of Reservation
            </h1>
          </div>
          <p>
            By booking a stay on ASVILLA, the guest agrees to abide by Indian hospitality regulations and hotel property conduct codes.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Check-in Identification:</strong> All guests must produce government-approved photo identification (Aadhaar, Passport, or Voter ID) upon physical arrival. PAN cards are not accepted as identity proof under Indian hotel regulations.</li>
            <li><strong>Occupancy Limits:</strong> Room occupancy must not exceed the maximum registered limit stated on your confirmation voucher.</li>
            <li><strong>Security Deposit:</strong> Individual hotels may request a refundable incidental credit card authorization upon check-in.</li>
          </ul>
        </div>
      )}

      {policyType === 'privacy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3 text-blue-800 pb-3 border-b border-slate-100">
            <Lock className="w-6 h-6 text-[#8C6D23]" />
            <h1 className="font-heading text-2xl font-bold text-[#0B132B]">
              Privacy & Data Protection Policy
            </h1>
          </div>
          <p>
            ASVILLA adheres to stringent digital data confidentiality standards:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We never store credit card numbers, CVVs, or bank netbanking credentials on our servers. All financial transactions are tokenized through Razorpay.</li>
            <li>Passkeys and passwords are encrypted using bcrypt salted hashing algorithms.</li>
            <li>Guest travel details are shared solely with the reserved hotel property to prepare your suite and arrange transfers. We do not sell guest data to third-party telemarketers.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

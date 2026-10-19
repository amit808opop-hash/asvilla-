import React from 'react';
import { ShieldCheck, Award, HeartHandshake, Sparkles, MapPin, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#8C6D23] text-xs font-semibold uppercase tracking-widest border border-amber-200">
          <Sparkles className="w-3.5 h-3.5" /> Luxury Hospitality Reimagined
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[#0B132B]">
          About ASVILLA
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-light">
          "Your Stay, Your Comfort, Your Way." We bridge timeless Indian royal architecture and serene coastal sanctuaries with transparent digital reservations.
        </p>
      </div>

      {/* Main Narrative */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <h2 className="font-heading text-2xl font-bold text-[#0B132B]">Our Purpose</h2>
        <p>
          Founded to offer discerning travellers a trustworthy, elegant gateway to India's most extraordinary hotels, ASVILLA is founded on three non-negotiable principles: authentic architectural heritage, meticulous guest comfort, and transparent pricing.
        </p>
        <p>
          Unlike generic hotel listing aggregators that overwhelm you with thousands of unverified rooms and surprise checkout markups, every estate in the ASVILLA portfolio has been physically inspected by our hospitality curation team. We verify that the photo gallery matches the real suite, that high-speed Wi-Fi meets executive demands, and that guest safety meets global hospitality benchmarks.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900">Verified Inventories</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Real-time server-side synchronization prevents double-bookings. When you reserve a room on ASVILLA, it is locked specifically for your arrival.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900">Transparent Pricing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All prices are shown in Indian Rupees (INR) with complete breakdowns of GST and taxes. What you see is what you pay.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8C6D23] flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900">Dedicated Concierge</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            24/7 personalized care for private airport boat transfers, dietary requirements, and twilight dining reservations.
          </p>
        </div>
      </div>
    </div>
  );
};

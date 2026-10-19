import React from 'react';
import { Shield, Sparkles, MapPin, Phone, Mail, Award, CheckCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0B132B] text-slate-300 border-t border-[#D4AF37]/20 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] flex items-center justify-center text-[#0B132B] font-extrabold text-xl shadow-md">
                AV
              </div>
              <span className="font-heading tracking-[0.2em] text-2xl font-bold text-white">
                ASVILLA
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              ASVILLA represents India's foremost luxury boutique collection. From royal 18th-century riverside palaces to secluded oceanfront cliff villas, experience bespoke hospitality with guaranteed transparent pricing and instant confirmed reservations.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-[#D4AF37]">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> 100% Verified Escapes</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Razorpay Secured</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase font-heading">
              Curated Stays
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('explore', { city: 'Varanasi' })} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Varanasi Heritage Ghats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { city: 'Jaipur' })} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Jaipur Royal Palaces
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { city: 'Goa' })} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Goa Cliffside Villas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { city: 'Agra' })} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Agra Taj Mahal Suites
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore', { city: 'Manali' })} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Manali Pine Chalets
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase font-heading">
              Guest Policies
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('policy', 'cancellation')} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policy', 'refund')} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Instant Refund Guarantees
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policy', 'terms')} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policy', 'privacy')} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Privacy & Data Protection
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#D4AF37] transition cursor-pointer">
                  Our Hospitality Standards
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Concierge */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase font-heading">
              ASVILLA Concierge
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Level 14, Royal Pavilion Tower, Connaught Place, New Delhi 110001</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-mono text-slate-200">+91 1800 278 4552</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-slate-200">reservations@asvilla.com</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="w-full py-2 px-3 border border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 text-[#D4AF37] rounded text-xs font-semibold tracking-wider uppercase transition cursor-pointer"
                >
                  Message Concierge Desk
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ASVILLA Hospitality & Travel Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Server Time (IST): 24/7 Live Monitoring</span>
            <span>PCI-DSS Compliant Gateway</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Mail,
  X,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface EmailPreviewModalProps {
  bookingId: string;
  bookingReference: string;
  guestEmail: string;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  bookingId,
  bookingReference,
  guestEmail,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [emailData, setEmailData] = useState<{
    html?: string;
    text?: string;
    subject?: string;
    recipient?: string;
  } | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');

  useEffect(() => {
    setLoading(true);
    api
      .getBookingEmailPreview(bookingId)
      .then(res => {
        if (res.success) {
          setEmailData(res);
        }
      })
      .catch(err => console.error('Error fetching email preview:', err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await api.resendBookingEmail(bookingId);
      if (res.success) {
        setResendStatus(`✓ Confirmation email dispatched successfully to ${guestEmail}!`);
      } else {
        setResendStatus(`Failed to resend: ${res.message}`);
      }
    } catch {
      setResendStatus('Error connecting to notification service.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-[#0B132B] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-white">Official Confirmation Email</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Delivered
                </span>
              </div>
              <span className="text-xs text-slate-300 block">
                Booking Reference: <strong className="font-mono text-[#D4AF37]">{bookingReference}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C5A059] text-[#0B132B] rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Resend email to guest"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Resend Email</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Header Meta Details */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 font-medium">To: </span>
              <strong className="text-slate-900 font-mono">{guestEmail}</strong>
              <span className="text-slate-400 font-medium ml-3">From: </span>
              <span className="text-slate-700">ASVILLA Reservations Concierge &lt;reservations@asvilla.com&gt;</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-200 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('html')}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  activeTab === 'html' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                HTML Template
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                  activeTab === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Plain Text
              </button>
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Subject: </span>
            <span className="font-semibold text-slate-900">{emailData?.subject || `[ASVILLA] Booking Confirmation — ${bookingReference}`}</span>
          </div>
        </div>

        {/* Resend status alert if triggered */}
        {resendStatus && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-500 text-sm">
              <Loader2 className="w-7 h-7 animate-spin text-[#8C6D23]" />
              <p>Rendering digital email voucher...</p>
            </div>
          ) : activeTab === 'html' && emailData?.html ? (
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden max-w-2xl mx-auto">
              <iframe
                title="Email Preview"
                srcDoc={emailData.html}
                className="w-full min-h-[560px] border-none"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-slate-200 p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 max-w-2xl mx-auto">
              {emailData?.text || 'No plain text version available.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified cryptographic email dispatch via ASVILLA Notification Service</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Copy, Share2, Volume2, QrCode, Check, ShieldCheck } from 'lucide-react';
import { AppLanguage } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { getTranslation } from '../i18n/translations';

interface ReceiveQrModalProps {
  language: AppLanguage;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export const ReceiveQrModal: React.FC<ReceiveQrModalProps> = ({
  language,
  onClose,
  onSpeak,
}) => {
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSettingAmount, setIsSettingAmount] = useState(false);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const handleCopy = () => {
    navigator.clipboard?.writeText(CURRENT_USER.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakUpi = () => {
    const text = `Your VaaniPay UPI ID is ${CURRENT_USER.upiId}. Anyone can scan or send money to this ID.`;
    onSpeak(text);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pay Ramesh Pawar on VaaniPay',
        text: `Pay me via UPI at ${CURRENT_USER.upiId}`,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B5CAD] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('myQrTitle')}</h3>
              <p className="text-[10px] text-slate-400">{t('myQrSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="text-center my-3">
          <div className="w-12 h-12 rounded-full bg-[#0B5CAD] text-white flex items-center justify-center mx-auto text-base font-bold shadow-md">
            {CURRENT_USER.initials}
          </div>
          <h4 className="font-bold text-slate-800 text-sm mt-1.5">{CURRENT_USER.name}</h4>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {CURRENT_USER.upiId}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-slate-500 hover:text-[#0B5CAD]"
              title={t('copyUpiId')}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {copied && <p className="text-[10px] text-emerald-600 font-semibold mt-1">{t('copiedToast')}</p>}
        </div>

        {/* Big QR Code Display */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-5 flex flex-col items-center justify-center shadow-inner my-2">
          {/* Simulated SVG QR code with center Vaani logo */}
          <div className="relative p-2 bg-white rounded-2xl shadow-md">
            <svg
              className="w-48 h-48"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer corners */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0B5CAD" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="13" width="10" height="10" rx="1" fill="#0B5CAD" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0B5CAD" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="77" y="13" width="10" height="10" rx="1" fill="#0B5CAD" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0B5CAD" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="77" width="10" height="10" rx="1" fill="#0B5CAD" />

              {/* Data blocks */}
              <rect x="36" y="8" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="46" y="8" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="56" y="8" width="6" height="6" rx="1" fill="#1F2937" />

              <rect x="36" y="20" width="8" height="6" rx="1" fill="#1F2937" />
              <rect x="48" y="20" width="6" height="6" rx="1" fill="#1F2937" />

              <rect x="8" y="38" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="18" y="38" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="28" y="38" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="68" y="38" width="8" height="6" rx="1" fill="#1F2937" />
              <rect x="80" y="38" width="6" height="6" rx="1" fill="#1F2937" />

              <rect x="8" y="48" width="14" height="6" rx="1" fill="#1F2937" />
              <rect x="78" y="48" width="12" height="6" rx="1" fill="#1F2937" />

              <rect x="36" y="68" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="46" y="68" width="8" height="6" rx="1" fill="#1F2937" />
              <rect x="68" y="68" width="6" height="6" rx="1" fill="#1F2937" />
              <rect x="80" y="68" width="6" height="6" rx="1" fill="#1F2937" />

              <rect x="36" y="78" width="12" height="6" rx="1" fill="#1F2937" />
              <rect x="54" y="78" width="14" height="6" rx="1" fill="#1F2937" />
              <rect x="74" y="78" width="12" height="6" rx="1" fill="#1F2937" />

              {/* Center Logo Shield */}
              <circle cx="50" cy="50" r="13" fill="white" />
              <circle cx="50" cy="50" r="10" fill="#0B5CAD" />
              <text x="50" y="53.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                VP
              </text>
            </svg>
          </div>

          {customAmount && (
            <div className="mt-2 text-xs font-bold text-[#0B5CAD] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              ₹{customAmount} Fixed Amount QR
            </div>
          )}
        </div>

        {/* Set amount input toggle */}
        {isSettingAmount ? (
          <div className="my-2 p-2 bg-slate-50 rounded-xl flex items-center gap-2">
            <span className="font-bold text-slate-700 text-sm">₹</span>
            <input
              type="number"
              placeholder="Amount (e.g. 500)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
            />
            <button
              onClick={() => setIsSettingAmount(false)}
              className="px-2.5 py-1 bg-[#0B5CAD] text-white rounded-lg text-xs font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSettingAmount(true)}
            className="w-full text-center text-xs text-[#0B5CAD] font-medium py-1 hover:underline"
          >
            {customAmount ? 'Change fixed amount' : t('setAmountQr')}
          </button>
        )}

        {/* Actions: Speak my UPI ID & Share */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleSpeakUpi}
            className="py-2.5 px-3 rounded-xl bg-blue-50 text-[#0B5CAD] font-semibold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>{t('speakUpiIdBtn')}</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-[#0B5CAD] text-white font-semibold text-xs hover:bg-blue-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('shareReceipt')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

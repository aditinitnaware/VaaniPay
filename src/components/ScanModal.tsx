import React, { useState } from 'react';
import { X, Flashlight, Image, QrCode, CheckCircle, ShieldCheck } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

interface ScanModalProps {
  language: AppLanguage;
  onClose: () => void;
  onScannedMerchant: (merchantData: { name: string; upiId: string; verified: boolean }) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  language,
  onClose,
  onScannedMerchant,
}) => {
  const [torchOn, setTorchOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const t = (key: string) => getTranslation(language, key);

  const handleSimulateScan = () => {
    setIsScanning(false);
    setTimeout(() => {
      onScannedMerchant({
        name: 'Sharma General Store',
        upiId: 'sharma@vaani',
        verified: true,
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 max-w-[430px] mx-auto animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex items-center justify-between text-white pt-2">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold tracking-wide">
          {t('scanPointCamera')}
        </span>

        <button
          onClick={() => setTorchOn(!torchOn)}
          className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
            torchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={t('scanTorch')}
          aria-label={t('scanTorch')}
        >
          <Flashlight className="w-5 h-5" />
        </button>
      </div>

      {/* Center Viewfinder */}
      <div className="relative my-auto flex flex-col items-center">
        <div className="relative w-64 h-64 rounded-3xl border-2 border-white/60 overflow-hidden flex items-center justify-center bg-black/30 backdrop-blur-[2px] shadow-2xl">
          {/* Laser animation */}
          {isScanning && (
            <div className="absolute left-4 right-4 h-0.5 bg-[#0B5CAD] scanner-laser shadow-[0_0_12px_#0B5CAD]" />
          )}

          {/* Corner frame markers */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

          {/* Center QR Graphic preview */}
          <div className="opacity-40 text-white flex flex-col items-center">
            <QrCode className="w-28 h-28" />
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-4 text-center max-w-[240px]">
          {t('scanPointCamera')}
        </p>

        {/* Simulate Scan Button */}
        <button
          onClick={handleSimulateScan}
          className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#0B5CAD] to-blue-600 text-white rounded-full text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 flex items-center gap-2 border border-blue-400/30"
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>{t('scanSimulateBtn')}</span>
        </button>
      </div>

      {/* Bottom controls */}
      <div className="flex justify-center pb-6">
        <button
          onClick={handleSimulateScan}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-md hover:bg-white/25 transition-colors"
        >
          <Image className="w-4 h-4" />
          <span>{t('scanUpload')}</span>
        </button>
      </div>
    </div>
  );
};

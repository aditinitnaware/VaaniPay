import React from 'react';
import {
  Send,
  Eye,
  QrCode,
  ArrowDownLeft,
  Zap,
  PhoneCall,
  Volume2,
  Sliders,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

interface SimplifiedHomeScreenProps {
  language: AppLanguage;
  onSendMoney: () => void;
  onCheckBalance: () => void;
  onScanQr: () => void;
  onReceiveMoney: () => void;
  onPayBills: () => void;
  onHelp: () => void;
  onExitSimplified: () => void;
  onSpeak: (text: string) => void;
}

export const SimplifiedHomeScreen: React.FC<SimplifiedHomeScreenProps> = ({
  language,
  onSendMoney,
  onCheckBalance,
  onScanQr,
  onReceiveMoney,
  onPayBills,
  onHelp,
  onExitSimplified,
  onSpeak,
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const buttons = [
    {
      id: 'send',
      label: t('simSendMoney'),
      desc: 'Send money to anyone',
      icon: Send,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      action: () => {
        onSpeak(t('simSendMoney'));
        onSendMoney();
      },
    },
    {
      id: 'balance',
      label: t('simCheckBalance'),
      desc: 'Check your bank balance',
      icon: Eye,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      action: () => {
        onSpeak(t('simCheckBalance'));
        onCheckBalance();
      },
    },
    {
      id: 'scan',
      label: t('simScanQr'),
      desc: 'Scan shop QR code',
      icon: QrCode,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      action: () => {
        onSpeak(t('simScanQr'));
        onScanQr();
      },
    },
    {
      id: 'receive',
      label: t('simReceiveMoney'),
      desc: 'Show your QR code',
      icon: ArrowDownLeft,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      action: () => {
        onSpeak(t('simReceiveMoney'));
        onReceiveMoney();
      },
    },
    {
      id: 'bills',
      label: t('simPayBills'),
      desc: 'Electricity & recharge',
      icon: Zap,
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      action: () => {
        onSpeak(t('simPayBills'));
        onPayBills();
      },
    },
    {
      id: 'help',
      label: t('simHelp'),
      desc: 'Call helpline or support',
      icon: PhoneCall,
      color: 'bg-rose-600 hover:bg-rose-700 text-white',
      action: () => {
        onSpeak(t('simHelp'));
        onHelp();
      },
    },
  ];

  return (
    <div className="pb-24 pt-4 px-3 space-y-4">
      {/* Banner indicating Simplified Mode with exit toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#0B5CAD]" />
          <span className="font-bold text-slate-800">{t('simplifiedModeTitle')}</span>
        </div>
        <button
          onClick={onExitSimplified}
          className="text-xs text-[#0B5CAD] font-bold underline hover:text-blue-800"
        >
          Standard Mode
        </button>
      </div>

      {/* 6 Giant Touch Buttons Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={btn.action}
              className={`h-36 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition-all cursor-pointer ${btn.color}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2.5 shadow-inner">
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-base font-extrabold tracking-tight leading-tight">
                {btn.label}
              </span>
              <span className="text-[11px] opacity-80 mt-1">{btn.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

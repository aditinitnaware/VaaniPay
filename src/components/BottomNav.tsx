import React from 'react';
import { Home, Gift, QrCode, History, User } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

export type NavTab = 'home' | 'rewards' | 'scan' | 'history' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: AppLanguage;
  onScanClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  language,
  onScanClick,
}) => {
  const t = (key: string) => getTranslation(language, key);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'home' ? 'text-[#0B5CAD]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={t('navHome')}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-1 font-medium ${currentTab === 'home' ? 'font-bold' : ''}`}>
            {t('navHome')}
          </span>
        </button>

        {/* Tab 2: Rewards */}
        <button
          onClick={() => onTabChange('rewards')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'rewards' ? 'text-[#0B5CAD]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={t('navRewards')}
        >
          <Gift className={`w-5 h-5 ${currentTab === 'rewards' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-1 font-medium ${currentTab === 'rewards' ? 'font-bold' : ''}`}>
            {t('navRewards')}
          </span>
        </button>

        {/* Center Floating Button: Scan QR */}
        <div className="flex justify-center items-center h-full relative -top-3">
          <button
            onClick={onScanClick}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0B5CAD] to-[#1E3A8A] text-white flex items-center justify-center shadow-lg shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all ring-4 ring-white"
            title={t('navScan')}
            aria-label={t('navScan')}
          >
            <QrCode className="w-7 h-7 stroke-[2.2]" />
          </button>
        </div>

        {/* Tab 4: History */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'history' ? 'text-[#0B5CAD]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={t('navHistory')}
        >
          <History className={`w-5 h-5 ${currentTab === 'history' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-1 font-medium ${currentTab === 'history' ? 'font-bold' : ''}`}>
            {t('navHistory')}
          </span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            currentTab === 'profile' ? 'text-[#0B5CAD]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={t('navProfile')}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className={`text-[11px] mt-1 font-medium ${currentTab === 'profile' ? 'font-bold' : ''}`}>
            {t('navProfile')}
          </span>
        </button>
      </div>
    </nav>
  );
};

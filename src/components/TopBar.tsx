/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Volume2, Globe, Sparkles, VolumeX } from 'lucide-react';
import { AppLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import { CURRENT_USER } from '../data/mockData';

interface TopBarProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onReadScreenAloud: () => void;
  isSpeaking: boolean;
  currentSentence?: string;
  onStopTTS?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  onLanguageChange,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onReadScreenAloud,
  isSpeaking,
  currentSentence,
  onStopTTS,
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pt-2.5 pb-2.5">
      {/* Prototype Badge */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1 text-[#0B5CAD]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B5CAD] animate-ping" />
          {t('prototypeBadge')}
        </span>
        <span className="text-slate-400">123PAY Simulated Engine</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0B5CAD] to-[#123B63] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            VP
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              {t('appName')}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none">Voice UPI</p>
          </div>
        </div>

        {/* Right actions: Language picker, Read Aloud, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Read Screen Aloud Button */}
          <button
            onClick={isSpeaking ? onStopTTS : onReadScreenAloud}
            className={`p-2 rounded-full border transition-all text-xs flex items-center gap-1 ${
              isSpeaking
                ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-400/40 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isSpeaking ? 'Stop reading' : t('listenScreen')}
            aria-label={t('listenScreen')}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-amber-800" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#0B5CAD]" />
            )}
            <span className="text-[11px] font-semibold hidden xs:inline">
              {isSpeaking ? 'Stop' : t('listenScreen')}
            </span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-1 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#0B5CAD] mr-1" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              aria-label={t('changeLanguage')}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title={t('notifications')}
            aria-label={t('notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-[#0B5CAD] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
            title={t('profile')}
            aria-label={t('profile')}
          >
            {CURRENT_USER.initials}
          </button>
        </div>
      </div>

      {/* Sentence currently being spoken on screen (CHANGE 2 requirement) */}
      {isSpeaking && currentSentence && (
        <div className="mt-2 py-1 px-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <Volume2 className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-bounce" />
          <span className="truncate">{currentSentence}</span>
        </div>
      )}
    </header>
  );
};

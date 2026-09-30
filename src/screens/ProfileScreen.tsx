/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Shield,
  Smartphone,
  Eye,
  Volume2,
  Lock,
  LogOut,
  Landmark,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Sliders,
  Type,
  SunMoon,
  Play,
  Languages,
  X,
} from 'lucide-react';
import { AppLanguage, BankAccount, AccessibilitySettings } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { getTranslation } from '../i18n/translations';

interface ProfileScreenProps {
  language: AppLanguage;
  accounts: BankAccount[];
  accessibility: AccessibilitySettings;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  onLockApp: () => void;
  onSpeak: (text: string) => void;
  onOpenCheckBalance: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  accounts,
  accessibility,
  availableVoices,
  selectedVoice,
  onSelectVoice,
  onUpdateAccessibility,
  onLockApp,
  onSpeak,
  onOpenCheckBalance,
}) => {
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reported, setReported] = useState(false);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReported(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReported(false);
      setReportNote('');
      onSpeak('Your report has been submitted to VaaniPay security team.');
    }, 1500);
  };

  const handleTestVoice = () => {
    const testPhrases: Record<AppLanguage, string> = {
      mr: 'नमस्कार! मी वाणीपे आहे. तुमची आर्थिक सुरक्षितता हीच आमची प्राथमिकता आहे.',
      hi: 'नमस्ते! मैं वाणीपे हूँ। आपकी वित्तीय सुरक्षा हमारी सर्वोच्च प्राथमिकता है।',
      ta: 'வணக்கம்! நான் வாணிபே. உங்கள் பாதுகாப்பு எங்கள் முன்னுரிமை.',
      te: 'నమస్కారం! నేను వాణీపే. మీ భద్రతే మా ప్రాధాన్యత.',
      bn: 'নমস্কার! আমি বাণীপে। আপনার আর্থিক নিরাপত্তা আমাদের অগ্রাধিকার।',
      en: 'Hello! I am VaaniPay. Your voice-first financial security assistant.',
    };
    onSpeak(testPhrases[language]);
  };

  return (
    <div className="pb-24 pt-3 px-3 space-y-4">
      {/* 1. User Profile Header Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#0B5CAD] text-white flex items-center justify-center font-bold text-lg shadow-md">
            {CURRENT_USER.initials}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {CURRENT_USER.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{CURRENT_USER.upiId}</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 {CURRENT_USER.phone}</p>
          </div>
        </div>

        <button
          onClick={onLockApp}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
          title="Lock App"
        >
          <Lock className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Linked Bank Accounts (CHANGE 1: STRICTLY NO BALANCE DISPLAYED) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Linked Bank Accounts
          </h3>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
            PIN Protected
          </span>
        </div>

        <div className="space-y-2.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0B5CAD] flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900">{acc.bankName}</h4>
                    {acc.isPrimary && (
                      <span className="text-[9px] font-bold bg-[#0B5CAD] text-white px-1.5 py-0.2 rounded-md">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">A/c {acc.accountNumberMasked}</p>
                </div>
              </div>

              {/* Secure Check Balance Button - Triggers PIN Gate */}
              <button
                onClick={onOpenCheckBalance}
                className="py-1.5 px-3 bg-white border border-slate-200 text-[#0B5CAD] font-bold text-[11px] rounded-xl hover:bg-blue-50 active:scale-95 transition-all shadow-2xs flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Check</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Voice & Speech Quality Settings (CHANGE 2) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#0B5CAD]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Voice & Audio Settings
            </h3>
          </div>
          <button
            onClick={handleTestVoice}
            className="px-2.5 py-1 bg-blue-50 text-[#0B5CAD] font-bold text-xs rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Test Voice</span>
          </button>
        </div>

        {/* Voice Selector */}
        {availableVoices.length > 0 && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Natural Regional Voice
            </label>
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const found = availableVoices.find((v) => v.name === e.target.value);
                if (found) onSelectVoice(found);
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[#0B5CAD]"
            >
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Speech Speed Picker */}
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-2">
            <span>Speech Speed (Pacing)</span>
            <span className="text-[#0B5CAD]">
              {accessibility.speechRate === 0.75
                ? 'Slow (Elderly)'
                : accessibility.speechRate === 1.05
                ? 'Fast'
                : 'Normal (0.9x)'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Slow (0.75x)', rate: 0.75 },
              { label: 'Normal (0.9x)', rate: 0.9 },
              { label: 'Fast (1.05x)', rate: 1.05 },
            ].map((item) => (
              <button
                key={item.rate}
                type="button"
                onClick={() => onUpdateAccessibility({ speechRate: item.rate })}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                  accessibility.speechRate === item.rate
                    ? 'bg-[#0B5CAD] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Native Numerals Display Option (OFF by default) */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Native Numerals Display</h4>
            <p className="text-[11px] text-slate-500">
              Display numbers as ०१२३४५६७८९ / ௦௧௨ (Does not alter PIN keypad)
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateAccessibility({ nativeNumerals: !accessibility.nativeNumerals })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              accessibility.nativeNumerals ? 'bg-[#0B5CAD]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                accessibility.nativeNumerals ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Accessibility & Senior Mode Settings */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0B5CAD]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('accessibilityTitle')}
          </h3>
        </div>

        {/* Simplified Mode Toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h4 className="text-xs font-bold text-slate-800">{t('simplifiedModeTitle')}</h4>
            <p className="text-[11px] text-slate-500">{t('simplifiedModeDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateAccessibility({ simplifiedMode: !accessibility.simplifiedMode })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              accessibility.simplifiedMode ? 'bg-[#0B5CAD]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                accessibility.simplifiedMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Voice-Only Mode Toggle */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800">{t('voiceOnlyTitle')}</h4>
            <p className="text-[11px] text-slate-500">{t('voiceOnlyDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateAccessibility({ voiceOnlyMode: !accessibility.voiceOnlyMode })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              accessibility.voiceOnlyMode ? 'bg-[#0B5CAD]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                accessibility.voiceOnlyMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Font Size Selector */}
        <div className="border-t border-slate-100 pt-3">
          <label className="block text-xs font-bold text-slate-800 mb-2">
            {t('fontSizeTitle')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onUpdateAccessibility({ fontSize: size })}
                className={`py-2 px-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  accessibility.fontSize === size
                    ? 'bg-[#0B5CAD] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Confirmations */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800">{t('voiceConfirmationsTitle')}</h4>
            <p className="text-[11px] text-slate-500">{t('voiceConfirmationsDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateAccessibility({ voiceConfirmations: !accessibility.voiceConfirmations })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              accessibility.voiceConfirmations ? 'bg-[#0B5CAD]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                accessibility.voiceConfirmations ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 5. Safety & Security Center */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          Safety & Support
        </h3>

        <button
          onClick={() => setShowSafetyModal(true)}
          className="w-full p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-left hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">{t('safetyTipsTitle')}</h4>
              <p className="text-[10px] text-amber-700">Important rules to avoid UPI scams</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600" />
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">{t('safetyReportTitle')}</h4>
              <p className="text-[10px] text-slate-500">Report suspicious payment request</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Safety Tips Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0B5CAD]" />
                <h3 className="text-sm font-bold text-slate-900">{t('safetyTipsTitle')}</h3>
              </div>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                <h4 className="font-bold text-red-900 mb-1">1. Never Share PIN or OTP</h4>
                <p className="text-[11px] text-red-700">
                  You NEVER need to enter your UPI PIN to receive money. PIN is only for debiting.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-1">2. Voice Privacy</h4>
                <p className="text-[11px] text-amber-700">
                  Only speak your demo PIN in private spaces. Never disclose it in public crowds.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <h4 className="font-bold text-[#0B5CAD] mb-1">3. Verify New Recipients</h4>
                <p className="text-[11px] text-blue-700">
                  Always check the recipient name and UPI handle before confirming any payment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full py-3 bg-[#0B5CAD] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-800"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{t('safetyReportTitle')}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reported ? (
              <div className="py-6 text-center text-emerald-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <h4 className="text-sm font-bold">Report Submitted</h4>
                <p className="text-xs text-slate-500 mt-1">Our safety team is investigating.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Provide details about any suspicious UPI ID, phone number or fake payment request.
                </p>
                <textarea
                  required
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Describe suspicious request or UPI ID..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0B5CAD]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700"
                >
                  Submit Security Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

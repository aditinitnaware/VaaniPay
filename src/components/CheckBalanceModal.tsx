/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Landmark, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AppLanguage, BankAccount } from '../types';
import { getTranslation } from '../i18n/translations';
import { PinScreen } from './PinScreen';
import { issuePinToken, getBalance, invalidateToken } from '../data/vault';
import { formatCurrencySpoken } from '../i18n/numberToWords';

interface CheckBalanceModalProps {
  language: AppLanguage;
  accounts: BankAccount[];
  voiceConfirmationsEnabled: boolean;
  onClose: () => void;
  onSpeak: (text: string) => void;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const CheckBalanceModal: React.FC<CheckBalanceModalProps> = ({
  language,
  accounts,
  voiceConfirmationsEnabled,
  onClose,
  onSpeak,
  onLanguageChange,
}) => {
  const [pinVerified, setPinVerified] = useState(false);
  const [activePinToken, setActivePinToken] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isAutoHidden, setIsAutoHidden] = useState(false);
  const [displayedBalance, setDisplayedBalance] = useState<number | null>(null);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Immediately discard token and balance if user switches tab or backgrounds app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activePinToken) {
          invalidateToken(activePinToken);
        }
        setDisplayedBalance(null);
        setIsAutoHidden(true);
        setActivePinToken(null);
        setPinVerified(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      if (activePinToken) {
        invalidateToken(activePinToken);
      }
    };
  }, [activePinToken]);

  // Handle PIN verification callback from PinScreen
  const handlePinSuccess = (enteredPin: string) => {
    const tokenResult = issuePinToken(enteredPin, selectedAccountId);
    if (tokenResult.success && tokenResult.token) {
      const token = tokenResult.token;
      setActivePinToken(token);
      setPinVerified(true);
      setIsAutoHidden(false);
      setSecondsRemaining(10);

      // Fetch balance strictly via vault using the temporary token
      const bal = getBalance(selectedAccountId, token);
      setDisplayedBalance(bal);

      // Spoken aloud ONLY AFTER PIN success, and ONLY if voice confirmations are ON
      if (voiceConfirmationsEnabled && bal !== null) {
        const spokenAmt = formatCurrencySpoken(bal, language);
        const msg = `${t('balanceYourBalIs')} ${spokenAmt}`;
        onSpeak(msg);
      }
    }
  };

  // 10-second countdown timer after PIN success
  useEffect(() => {
    if (!pinVerified || isAutoHidden || !activePinToken) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time expired: auto-hide and discard token
          setIsAutoHidden(true);
          setDisplayedBalance(null);
          if (activePinToken) {
            invalidateToken(activePinToken);
            setActivePinToken(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pinVerified, isAutoHidden, activePinToken]);

  // If PIN has not been verified, display the strict PIN gate
  if (!pinVerified) {
    return (
      <PinScreen
        isModal
        language={language}
        onLanguageChange={onLanguageChange}
        title={t('actionCheckBalance')}
        subtitle={t('balancePinReq')}
        onSuccess={handlePinSuccess}
        onCancel={onClose}
        onSpeak={onSpeak}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B5CAD] flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('balanceTitle')}</h3>
              <p className="text-[10px] text-slate-400">NPCI 123PAY Encrypted</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (activePinToken) invalidateToken(activePinToken);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Selector Tabs (Only shows Bank Name and Masked account number, NEVER balance) */}
        <div className="flex gap-2 my-4 p-1 bg-slate-100 rounded-xl">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => {
                // Switching account invalidates token and requires fresh PIN gate
                if (activePinToken) invalidateToken(activePinToken);
                setActivePinToken(null);
                setDisplayedBalance(null);
                setSelectedAccountId(acc.id);
                setPinVerified(false);
              }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                selectedAccountId === acc.id
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="truncate">{acc.bankName.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-400">{acc.accountNumberMasked}</div>
            </button>
          ))}
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#123B63] to-[#0B5CAD] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden text-center my-2">
          <p className="text-xs text-blue-200 font-medium">{activeAccount.bankName}</p>
          <p className="text-[11px] text-blue-300 mb-3">{activeAccount.accountNumberMasked}</p>

          {isAutoHidden || displayedBalance === null ? (
            <div className="py-2">
              <div className="text-3xl font-bold tracking-widest text-blue-200">
                ••••••
              </div>
              <button
                onClick={() => {
                  setPinVerified(false);
                  setIsAutoHidden(false);
                }}
                className="mt-3 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold hover:bg-white/30 flex items-center gap-1.5 mx-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{t('balanceCheckBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="py-2">
              <div className="text-3xl font-extrabold tracking-tight">
                ₹{displayedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-blue-200 mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Available Balance</span>
              </p>
            </div>
          )}

          {/* Countdown indicator */}
          {!isAutoHidden && displayedBalance !== null && (
            <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-200">
              <span className="flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                <span>{t('balanceCountdown')}</span>
              </span>
              <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                {secondsRemaining}s
              </span>
            </div>
          )}
        </div>

        {/* Footer Done */}
        <button
          onClick={() => {
            if (activePinToken) invalidateToken(activePinToken);
            onClose();
          }}
          className="w-full mt-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
        >
          {t('done')}
        </button>
      </div>
    </div>
  );
};

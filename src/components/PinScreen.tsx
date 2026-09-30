/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Delete, Mic, Fingerprint, Lock, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppLanguage } from '../types';
import { DEMO_PIN } from '../data/mockData';
import { SUPPORTED_LANGUAGES, getLanguageOption } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import { parseSpokenPin } from '../engine/voiceParsers';

interface PinScreenProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onSuccess: (pinUsed: string) => void;
  title?: string;
  subtitle?: string;
  requiredPin?: string;
  isModal?: boolean;
  onCancel?: () => void;
  onSpeak?: (text: string) => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  language,
  onLanguageChange,
  onSuccess,
  title,
  subtitle,
  requiredPin = DEMO_PIN,
  isModal = false,
  onCancel,
  onSpeak,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Dedicated Voice PIN states
  const [isVoicePinOpen, setIsVoicePinOpen] = useState(false);
  const [isVoicePinListening, setIsVoicePinListening] = useState(false);
  const [voicePinStatusText, setVoicePinStatusText] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<any>(null);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setErrorMsg(null);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  const handleDigit = (digit: string) => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyPin = (entered: string) => {
    if (entered === requiredPin) {
      setErrorMsg(null);
      setTimeout(() => {
        setPin('');
        onSuccess(entered);
      }, 150);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      const incorrectNotice = t('pinIncorrect');
      if (onSpeak) {
        onSpeak(incorrectNotice);
      }

      if (newAttempts >= 3) {
        const lockoutTime = Date.now() + 30000;
        setLockedUntil(lockoutTime);
        setSecondsLeft(30);
        const lockMsg = t('pinLockedMsg');
        setErrorMsg(lockMsg);
        if (onSpeak) onSpeak(lockMsg);
      } else {
        setErrorMsg(`${incorrectNotice} (${3 - newAttempts} left)`);
      }
    }
  };

  /**
   * CHANGE 4: DEDICATED VOICE PIN SPEECH RECOGNITION
   * - continuous = false
   * - interimResults = true
   * - maxAlternatives = 5
   * - Checks ALL alternatives for 4 digits
   * - Retries with en-IN if UI locale yields no match
   * - NEVER logs, displays, or speaks digits!
   */
  const startVoicePinRecognition = (retryWithEnIn: boolean = false) => {
    setMicError(null);
    setIsVoicePinListening(true);
    setVoicePinStatusText(t('pinVoiceListening'));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please use the keypad.');
      setIsVoicePinListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 5;

      const activeLocale = retryWithEnIn ? 'en-IN' : getLanguageOption(language).locale;
      rec.lang = activeLocale;

      // 8-second no-speech timeout
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        try {
          rec.stop();
        } catch (_) {}
        setIsVoicePinListening(false);
        setVoicePinStatusText('No speech detected in 8s. Tap mic to retry or use keypad.');
      }, 8000);

      rec.onresult = (event: any) => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

        let fourDigitsFound: string | null = null;
        let partial: string = '';

        // Check ALL alternatives across results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          for (let j = 0; j < res.length; j++) {
            const altText = res[j].transcript;
            const parsed = parseSpokenPin(altText);
            if (parsed.digits) {
              fourDigitsFound = parsed.digits;
              break;
            } else if (parsed.partialDigits) {
              partial = parsed.partialDigits;
            }
          }
          if (fourDigitsFound) break;
        }

        if (fourDigitsFound) {
          // Immediately update masked dots
          setPin(fourDigitsFound);
          try {
            rec.stop();
          } catch (_) {}
          setIsVoicePinListening(false);
          setIsVoicePinOpen(false);
          verifyPin(fourDigitsFound);
        } else if (partial) {
          // Update masked dots for partial digits (NEVER displaying the raw numbers)
          setPin(partial);
          setVoicePinStatusText(`Captured ${partial.length} of 4 digits. Please say remaining digits.`);
        }
      };

      rec.onerror = (e: any) => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        const errType = e?.error;
        if (errType === 'not-allowed' || errType === 'permission-denied') {
          setMicError('Please allow microphone access to use Voice PIN.');
        } else if (errType === 'no-speech') {
          if (!retryWithEnIn && language !== 'en') {
            // Auto retry with en-IN
            startVoicePinRecognition(true);
            return;
          }
          setVoicePinStatusText('No speech detected. Tap mic to try again.');
        }
        setIsVoicePinListening(false);
      };

      rec.onend = () => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        setIsVoicePinListening(false);
      };

      rec.start();
    } catch (err) {
      console.warn('Voice PIN start failed:', err);
      setIsVoicePinListening(false);
      setMicError('Microphone could not be started.');
    }
  };

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  return (
    <div
      className={`${
        isModal
          ? 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
          : 'min-h-screen bg-[#F4F7FA] flex flex-col justify-between p-4 max-w-[430px] mx-auto'
      }`}
    >
      <div
        className={`w-full ${
          isModal ? 'bg-white rounded-3xl p-6 shadow-2xl max-w-sm' : 'flex-1 flex flex-col justify-between'
        }`}
      >
        {/* Header with language picker */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0B5CAD] flex items-center justify-center text-white font-bold text-sm">
              VP
            </div>
            <span className="font-semibold text-slate-800 text-sm">VaaniPay</span>
          </div>

          {/* Language dropdown */}
          <div className="relative flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-xs shadow-sm">
            <Globe className="w-3.5 h-3.5 text-[#0B5CAD]" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
              aria-label={t('changeLanguage')}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Title, Masked Dots, Status */}
        <div className="text-center my-auto py-2">
          <div className="w-14 h-14 bg-blue-50 text-[#0B5CAD] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            {isLocked ? <Lock className="w-7 h-7 text-red-600 animate-pulse" /> : <Shield className="w-7 h-7" />}
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {title || t('pinTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
            {subtitle || t('pinSubtitle')}
          </p>

          <div className="inline-block mt-2 px-2.5 py-1 bg-blue-50/80 rounded-md border border-blue-100 text-[11px] font-medium text-[#0B5CAD]">
            {t('pinDemoHint')}
          </div>

          {/* Masked PIN Dots (NEVER shows numbers) */}
          <div className="flex justify-center items-center gap-4 my-6" aria-label="PIN entry">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    filled
                      ? 'bg-[#0B5CAD] scale-110 shadow-md ring-4 ring-blue-100'
                      : 'border-2 border-slate-300 bg-white'
                  }`}
                />
              );
            })}
          </div>

          {/* Feedback / Lock Message */}
          {errorMsg && (
            <div className="text-xs font-medium text-red-600 bg-red-50 py-1.5 px-3 rounded-lg inline-block border border-red-200 animate-shake">
              {errorMsg} {isLocked && `(${secondsLeft}s)`}
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-[340px] mx-auto mt-2">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                disabled={isLocked}
                onClick={() => handleDigit(digit)}
                className="h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-semibold shadow-sm hover:bg-slate-50 active:scale-95 active:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#0B5CAD]"
              >
                {digit}
              </button>
            ))}

            {/* Voice PIN Button */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => {
                setIsVoicePinOpen(true);
                startVoicePinRecognition();
              }}
              className="h-14 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-[#0B5CAD] font-medium text-xs flex flex-col items-center justify-center gap-1 hover:bg-blue-100/70 active:scale-95 transition-all disabled:opacity-40"
              title={t('pinVoiceButton')}
            >
              <Mic className="w-5 h-5 text-[#0B5CAD]" />
              <span className="text-[10px] font-semibold">{t('pinVoiceButton')}</span>
            </button>

            {/* 0 */}
            <button
              disabled={isLocked}
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 text-2xl font-semibold shadow-sm hover:bg-slate-50 active:scale-95 active:bg-blue-50 transition-all disabled:opacity-40 flex items-center justify-center"
            >
              0
            </button>

            {/* Backspace */}
            <button
              disabled={isLocked}
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-slate-100/80 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-40"
              aria-label="Delete"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Secondary Actions: Fingerprint & Cancel/Forgot */}
          <div className="flex items-center justify-between mt-4 px-2 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!isLocked) {
                  onSuccess('1234');
                }
              }}
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#0B5CAD] font-medium py-1.5"
            >
              <Fingerprint className="w-4 h-4 text-[#0B5CAD]" />
              <span>{t('pinFingerprint')}</span>
            </button>

            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-800 font-medium py-1.5"
              >
                {t('voiceCancelBtn')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('Demo PIN is 1234');
                }}
                className="text-slate-500 hover:text-slate-700 font-medium py-1.5"
              >
                {t('pinForgot')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice PIN Modal / Warning Sheet (CHANGE 4) */}
      {isVoicePinOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Warning requirement */}
            <div className="flex items-start gap-3 text-amber-800 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 mb-0.5">
                  Speak your PIN only in a private place
                </h4>
                <p className="text-[11px] text-amber-700 leading-tight">
                  This is a demo PIN. Spoken digits are masked as dots immediately and never saved, logged, or spoken aloud.
                </p>
              </div>
            </div>

            <div className="my-5 text-center">
              <button
                onClick={() => startVoicePinRecognition()}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white shadow-xl transition-all ${
                  isVoicePinListening
                    ? 'bg-red-500 voice-pulse ring-8 ring-red-400/20'
                    : 'bg-[#0B5CAD] hover:bg-blue-700'
                }`}
                aria-label="Tap to speak PIN"
              >
                <Mic className="w-8 h-8" />
              </button>
              <p className="text-xs font-semibold text-slate-800 mt-3">
                {isVoicePinListening ? 'Listening for your PIN...' : 'Tap mic and speak 4 digits'}
              </p>
              {voicePinStatusText && (
                <p className="text-[11px] text-slate-500 mt-1">{voicePinStatusText}</p>
              )}
              {micError && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{micError}</p>
              )}
              <div className="mt-2 text-[10px] text-slate-400">
                Examples: "1 2 3 4" • "one two three four" • "एक दोन तीन चार" • "twelve thirty four"
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (recognitionRef.current) {
                    try {
                      recognitionRef.current.abort();
                    } catch (_) {}
                  }
                  setIsVoicePinListening(false);
                  setIsVoicePinOpen(false);
                }}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Use Keypad Instead
              </button>
              <button
                type="button"
                onClick={() => startVoicePinRecognition()}
                className="px-4 py-3 rounded-xl bg-blue-50 text-[#0B5CAD] font-semibold text-xs hover:bg-blue-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

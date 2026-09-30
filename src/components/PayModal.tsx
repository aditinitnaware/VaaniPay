/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Share2,
  FileText,
  Mic,
  ArrowRight,
  UserCheck,
  Phone,
  Landmark,
  Check,
  RefreshCw,
  Delete,
} from 'lucide-react';
import { AppLanguage, Contact, BankAccount, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { PinScreen } from './PinScreen';
import { parseSpokenMobile, isConfirmationResponse } from '../engine/voiceParsers';
import { formatPhoneSpoken, formatCurrencySpoken } from '../i18n/numberToWords';
import { issuePinToken, deductBalance } from '../data/vault';

export type PaymentFlowType = 'contact' | 'phone' | 'upi' | 'qr' | 'bill';

interface PayModalProps {
  language: AppLanguage;
  flowType: PaymentFlowType;
  initialRecipient?: {
    name: string;
    upiId: string;
    phone?: string;
    avatarColor?: string;
    initials?: string;
    isVerified?: boolean;
    isNew?: boolean;
  };
  initialAmount?: number;
  accounts: BankAccount[];
  contacts: Contact[];
  onClose: () => void;
  onPaymentSuccess: (transaction: Transaction) => void;
  onSpeak: (text: string) => void;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const PayModal: React.FC<PayModalProps> = ({
  language,
  flowType,
  initialRecipient,
  initialAmount,
  accounts,
  contacts,
  onClose,
  onPaymentSuccess,
  onSpeak,
  onLanguageChange,
}) => {
  const [step, setStep] = useState<'details' | 'amount' | 'review' | 'pin' | 'processing' | 'success'>('amount');

  // Recipient details
  const [recipientName, setRecipientName] = useState(initialRecipient?.name || '');
  const [recipientUpi, setRecipientUpi] = useState(initialRecipient?.upiId || '');
  const [phoneNumber, setPhoneNumber] = useState(initialRecipient?.phone || '');
  const [isNewRecipient, setIsNewRecipient] = useState(Boolean(initialRecipient?.isNew));
  const [isVerified, setIsVerified] = useState(Boolean(initialRecipient?.isVerified));

  // Payment details
  const [amount, setAmount] = useState<string>(initialAmount ? String(initialAmount) : '');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [createdTransaction, setCreatedTransaction] = useState<Transaction | null>(null);

  // Phone voice input states (CHANGE 5)
  const [isListeningPhone, setIsListeningPhone] = useState(false);
  const [phoneConfirming, setPhoneConfirming] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const phoneRecRef = useRef<any>(null);
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  // Initialize step based on initial data
  useEffect(() => {
    if (!initialRecipient?.upiId && !initialRecipient?.phone && flowType !== 'bill') {
      setStep('details');
    }
  }, [flowType, initialRecipient]);

  // Clean up recognition
  useEffect(() => {
    return () => {
      if (phoneRecRef.current) {
        try {
          phoneRecRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  /**
   * Phone number lookup in contact directory
   */
  const handlePhoneLookup = (phoneStr: string) => {
    const cleanDigits = phoneStr.replace(/\D/g, '').slice(-10);
    setPhoneNumber(cleanDigits);
    setPhoneError(null);

    const matched = contacts.find((c) => c.phone.replace(/\D/g, '').endsWith(cleanDigits));
    if (matched) {
      setRecipientName(matched.name);
      setRecipientUpi(matched.upiId);
      setIsNewRecipient(false);
      setIsVerified(true);
    } else if (cleanDigits.length >= 10) {
      setRecipientName(`User ${cleanDigits.slice(-4)}`);
      setRecipientUpi(`${cleanDigits}@vaani`);
      setIsNewRecipient(true); // Flag as new recipient
      setIsVerified(false);
    }
  };

  /**
   * CHANGE 5: VOICE ENTRY OF MOBILE NUMBER
   * - Big mic button "Speak the number"
   * - parseSpokenMobile normalises multi-lingual digit words
   * - Appends digits across multiple utterances
   * - Reads back slowly with short pauses
   * - Asks "Is this correct? Say yes to continue or change"
   */
  const startPhoneVoiceInput = (retryWithEnIn: boolean = false) => {
    setIsListeningPhone(true);
    setPhoneError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Friendly fallback
      setPhoneError('Speech not supported in browser, please type using keypad.');
      setIsListeningPhone(false);
      return;
    }

    try {
      if (phoneRecRef.current) {
        try {
          phoneRecRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRecognition();
      phoneRecRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      rec.lang = retryWithEnIn ? 'en-IN' : language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      rec.onresult = (e: any) => {
        let latestTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          latestTranscript += e.results[i][0].transcript;
        }

        // Parse with existing digits to support chunked speech ("98765" then "43210")
        const parsed = parseSpokenMobile(latestTranscript, language, phoneNumber);

        if (parsed.digits) {
          setPhoneNumber(parsed.digits);
          handlePhoneLookup(parsed.digits);

          if (parsed.isValid) {
            rec.stop();
            setIsListeningPhone(false);

            // Read back digit-by-digit slowly
            const phoneSpoken = formatPhoneSpoken(parsed.digits, language);
            const confirmationQuestion =
              language === 'mr'
                ? `मोबाईल नंबर: ${phoneSpoken}. हा नंबर बरोबर आहे का? पुढे जाण्यासाठी होय म्हणा किंवा बदला म्हणा.`
                : language === 'hi'
                ? `मोबाइल नंबर: ${phoneSpoken}. क्या यह सही है? आगे बढ़ने के लिए हाँ बोलें या बदलो बोलें।`
                : `Mobile number: ${phoneSpoken}. Is this correct? Say yes to continue or say change.`;

            setPhoneConfirming(true);
            onSpeak(confirmationQuestion);

            // Listen for confirmation
            setTimeout(() => {
              listenForPhoneConfirm(parsed.digits);
            }, 4000);
          }
        }
      };

      rec.onerror = (e: any) => {
        setIsListeningPhone(false);
        if (!retryWithEnIn && language !== 'en') {
          startPhoneVoiceInput(true);
        } else {
          setPhoneError('Could not recognize number. Please speak clearly or use keypad.');
        }
      };

      rec.onend = () => {
        setIsListeningPhone(false);
      };

      rec.start();
    } catch (_) {
      setIsListeningPhone(false);
    }
  };

  /**
   * Listen for "yes/confirm" or "change/clear"
   */
  const listenForPhoneConfirm = (validatedNumber: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript.toLowerCase();
        if (text.includes('change') || text.includes('clear') || text.includes('बदला') || text.includes('बदलो')) {
          setPhoneNumber('');
          setPhoneConfirming(false);
          onSpeak(language === 'mr' ? 'नंबर साफ केला. पुन्हा सांगा.' : 'Number cleared. Please speak again.');
        } else if (
          text.includes('yes') ||
          text.includes('confirm') ||
          text.includes('हो') ||
          text.includes('हाँ') ||
          text.includes('बरोबर')
        ) {
          setPhoneConfirming(false);
          setStep('amount');
        }
      };

      rec.start();
    } catch (_) {}
  };

  /**
   * Validate mobile number before proceeding to amount
   */
  const handleProceedFromPhone = () => {
    const clean = phoneNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      const err =
        language === 'mr'
          ? 'कृपया वैध १०-अंकी मोबाईल नंबर प्रविष्ट करा.'
          : language === 'hi'
          ? 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.';
      setPhoneError(err);
      onSpeak(err);
      return;
    }

    handlePhoneLookup(clean);
    setStep('amount');
  };

  /**
   * Proceed from Amount to Review
   */
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    // Fraud detection warning for high amount or new recipient
    if (isNewRecipient || numericAmount > 5000) {
      const warnMsg = isNewRecipient
        ? `${t('fraudWarningTitle')}: ${t('fraudWarningNewRecipient')}`
        : `${t('fraudWarningTitle')}: High amount warning for ₹${numericAmount}`;
      onSpeak(warnMsg);
    }

    setStep('review');
  };

  /**
   * PIN success verification
   */
  const handlePinSuccess = (enteredPin: string) => {
    setStep('processing');

    const numericAmount = parseFloat(amount) || 0;
    const tokenResult = issuePinToken(enteredPin, selectedAccountId);

    if (tokenResult.success && tokenResult.token) {
      // Deduct balance securely in mock vault
      deductBalance(selectedAccountId, numericAmount, tokenResult.token);

      setTimeout(() => {
        const tx: Transaction = {
          id: 'vpy_' + Date.now(),
          utrNumber: 'VPY-2026' + Math.floor(1000 + Math.random() * 9000),
          type: 'sent',
          title: recipientName || 'Payment',
          subtitle: `To: ${recipientUpi || phoneNumber}`,
          amount: numericAmount,
          timestamp: new Date().toISOString(),
          status: 'success',
          recipientUpiId: recipientUpi,
          bankAccountId: selectedAccountId,
          note: note || undefined,
        };

        setCreatedTransaction(tx);
        setStep('success');
        onPaymentSuccess(tx);

        const amtWords = formatCurrencySpoken(numericAmount, language);
        const spokenMsg = `${t('paySuccessTitle')}. ${amtWords} ${t('voiceSuccessMsg', {
          amount: numericAmount,
          recipient: recipientName,
        })}`;
        onSpeak(spokenMsg);
      }, 1500);
    } else {
      setStep('pin');
    }
  };

  // 1. PIN Screen Step
  if (step === 'pin') {
    return (
      <PinScreen
        isModal
        language={language}
        onLanguageChange={onLanguageChange}
        title={t('pinTitle')}
        subtitle={`Sending ₹${amount} to ${recipientName}`}
        onSuccess={handlePinSuccess}
        onCancel={() => setStep('review')}
        onSpeak={onSpeak}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B5CAD] flex items-center justify-center font-bold text-xs">
              {recipientName ? recipientName[0].toUpperCase() : 'VP'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {recipientName || (flowType === 'phone' ? 'Pay to Mobile' : 'Payment')}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {recipientUpi || (phoneNumber ? `+91 ${phoneNumber}` : '123PAY Direct')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP: PHONE NUMBER ENTRY (CHANGE 5) */}
        {step === 'details' && flowType === 'phone' && (
          <div className="p-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">{t('actionPayPhone')}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Speak 10-digit number or use keypad</p>
            </div>

            {/* Controlled 10-digit input field with large grouped digits */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  value={
                    phoneNumber.length === 10
                      ? `${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`
                      : phoneNumber
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneNumber(digits);
                    handlePhoneLookup(digits);
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 text-slate-900 font-mono text-lg font-bold tracking-wider focus:outline-none focus:border-[#0B5CAD]"
                />
                <button
                  type="button"
                  onClick={() => startPhoneVoiceInput()}
                  className={`absolute right-2 top-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isListeningPhone
                      ? 'bg-red-500 text-white voice-pulse'
                      : 'bg-blue-50 text-[#0B5CAD] hover:bg-blue-100'
                  }`}
                  title="Speak the number"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              {phoneError && <p className="text-xs text-red-600 font-medium mt-1.5">{phoneError}</p>}

              {/* Resolved contact banner or new recipient flag */}
              {phoneNumber.length === 10 && (
                <div
                  className={`mt-3 p-3 rounded-xl flex items-center gap-2.5 text-xs ${
                    isNewRecipient
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">{recipientName}</span>
                    <p className="text-[10px] opacity-80 font-mono">{recipientUpi}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Big Mic Button "Speak the number" */}
            <div className="text-center py-2">
              <button
                type="button"
                onClick={() => startPhoneVoiceInput()}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${
                  isListeningPhone ? 'bg-red-500 voice-pulse ring-8 ring-red-400/20' : 'bg-[#0B5CAD] hover:bg-blue-700'
                }`}
              >
                <Mic className="w-7 h-7" />
              </button>
              <p className="text-xs font-bold text-slate-700 mt-2">
                {isListeningPhone ? 'Listening for digits...' : 'Tap & Speak the number'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                "नऊ आठ सात सहा..." or "nine eight seven six..."
              </p>
            </div>

            <button
              type="button"
              disabled={phoneNumber.length !== 10}
              onClick={handleProceedFromPhone}
              className="w-full py-3.5 rounded-2xl bg-[#0B5CAD] text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              Continue to Amount
            </button>
          </div>
        )}

        {/* STEP: AMOUNT ENTRY */}
        {step === 'amount' && (
          <form onSubmit={handleProceedToReview} className="p-5 space-y-4">
            {/* Amount input */}
            <div className="text-center py-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t('payEnterAmount')}
              </label>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-extrabold text-slate-900">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-48 text-4xl font-extrabold text-slate-900 tracking-tight text-center focus:outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Spoken conversion hint */}
              {amount && !isNaN(parseFloat(amount)) && (
                <p className="text-xs text-[#0B5CAD] font-medium mt-2">
                  {formatCurrencySpoken(parseFloat(amount), language)}
                </p>
              )}
            </div>

            {/* Quick amount chips */}
            <div className="flex justify-center gap-2">
              {[100, 200, 500, 1000, 2000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className="py-1 px-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:border-[#0B5CAD] hover:text-[#0B5CAD] active:scale-95 transition-all"
                >
                  +₹{val}
                </button>
              ))}
            </div>

            {/* Add note */}
            <div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5CAD]"
              />
            </div>

            {/* Bank account selector (CHANGE 1: Strictly NO balance displayed) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pay From
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B5CAD] flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{activeAccount.bankName}</h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      A/c {activeAccount.accountNumberMasked}
                    </p>
                  </div>
                </div>
                {/* Shows only masked indicator, never actual balance */}
                <span className="text-xs font-bold text-slate-400 font-mono">••••••</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 rounded-2xl bg-[#0B5CAD] text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              Review Payment
            </button>
          </form>
        )}

        {/* STEP: REVIEW & SAFETY CHECKS */}
        {step === 'review' && (
          <div className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Review Transfer
            </h4>

            {/* Safety Warning if high amount or new recipient */}
            {(isNewRecipient || parseFloat(amount) > 5000) && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">{t('fraudWarningTitle')}</h5>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-tight">
                    {isNewRecipient
                      ? t('fraudWarningNewRecipient')
                      : 'Amount exceeds ₹5,000. Please verify recipient before proceeding.'}
                  </p>
                </div>
              </div>
            )}

            {/* Transfer Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient</span>
                <span className="font-bold text-slate-900">{recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UPI ID / Mobile</span>
                <span className="font-mono text-slate-700">{recipientUpi || phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Debiting from</span>
                <span className="font-semibold text-slate-700">
                  {activeAccount.bankName} ({activeAccount.accountNumberMasked})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="font-extrabold text-[#0B5CAD]">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('amount')}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('pin')}
                className="flex-2 py-3 rounded-xl bg-[#0B5CAD] text-white font-bold text-xs hover:bg-blue-800 shadow-md"
              >
                Proceed to PIN
              </button>
            </div>
          </div>
        )}

        {/* STEP: PROCESSING */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 border-4 border-[#0B5CAD] border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Connecting to UPI 123PAY...</h4>
            <p className="text-xs text-slate-500">Securing simulated transaction</p>
          </div>
        )}

        {/* STEP: SUCCESS RECEIPT */}
        {step === 'success' && createdTransaction && (
          <div className="p-5 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-in zoom-in-95">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-slate-900">{t('paySuccessTitle')}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Paid to {recipientName}</p>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                ₹{createdTransaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                {formatCurrencySpoken(createdTransaction.amount, language)}
              </p>
            </div>

            {/* Transaction metadata */}
            <div className="bg-slate-50 rounded-2xl p-3 text-left text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Ref ID:</span>
                <span className="font-mono font-bold text-slate-800">{createdTransaction.utrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-slate-700">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">From Account:</span>
                <span className="text-slate-700">{activeAccount.bankName} {activeAccount.accountNumberMasked}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 transition-colors shadow-md"
            >
              {t('done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

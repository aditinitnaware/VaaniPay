/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
  Sparkles,
  Volume2,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AppLanguage, Contact, ParsedVoiceIntent, AssistantStateMachine } from '../types';
import { getTranslation } from '../i18n/translations';
import { parseVoiceInput } from '../engine/intentEngine';
import { isConfirmationResponse, parseSpokenPin } from '../engine/voiceParsers';
import { useSpeech } from '../hooks/useSpeech';
import { formatCurrencySpoken } from '../i18n/numberToWords';
import { DEMO_PIN } from '../data/mockData';

interface VoiceCardProps {
  language: AppLanguage;
  contacts: Contact[];
  onExecuteIntent: (parsed: ParsedVoiceIntent) => void;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onInspectIntent?: (parsed: ParsedVoiceIntent) => void;
  onPaymentSuccess?: (payment: { recipient: string; amount: number; utr: string }) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  language,
  contacts,
  onExecuteIntent,
  onSpeak,
  isSpeaking,
  onInspectIntent,
  onPaymentSuccess,
}) => {
  // Explicit State Machine (CHANGE 3)
  const [state, setState] = useState<AssistantStateMachine>('IDLE');
  const [typedInput, setTypedInput] = useState('');
  const [activeParsed, setActiveParsed] = useState<ParsedVoiceIntent | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [reAskCount, setReAskCount] = useState(0);

  // PIN Checkout state inside assistant
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string>('');

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeech(language, isSpeaking);

  // Dedicated confirmation speech recognition ref
  const confirmRecRef = useRef<any>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (confirmRecRef.current) {
        try {
          confirmRecRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // When speech recognition produces a final transcript in general mode
  useEffect(() => {
    if (transcript && !isListening && state === 'LISTENING') {
      handleProcessText(transcript);
    }
  }, [transcript, isListening, state]);

  /**
   * Main text/voice parsing logic
   */
  const handleProcessText = (rawText: string) => {
    if (!rawText.trim()) {
      setState('IDLE');
      return;
    }

    const parsed = parseVoiceInput(rawText, contacts);
    setActiveParsed(parsed);
    if (onInspectIntent) {
      onInspectIntent(parsed);
    }

    // Saying "confirm payment" when nothing is pending -> "There is no payment to confirm."
    if (parsed.intent === 'CONFIRM_PAYMENT') {
      if (state !== 'AWAITING_CONFIRMATION') {
        const noPaymentMsg =
          language === 'mr'
            ? 'पुष्टी करण्यासाठी कोणतेही पेमेंट प्रलंबित नाही.'
            : language === 'hi'
            ? 'पुष्टि करने के लिए कोई पेमेंट बाकी नहीं है।'
            : 'There is no payment to confirm.';
        onSpeak(noPaymentMsg);
        setState('IDLE');
        return;
      }
    }

    if (parsed.intent === 'CANCEL_PAYMENT') {
      handleCancel('Payment cancelled');
      return;
    }

    // Step 1: Read back what the user said
    const readbackPhrase = `${t('voiceYouSaid')} "${rawText}"`;

    if (parsed.intent === 'FRAUD_ALERT') {
      setState('IDLE');
      const warningText = t('fraudSensitiveKeyword');
      onSpeak(`${readbackPhrase}. ${warningText}`);
      return;
    }

    if (parsed.intent === 'SEND_MONEY' && parsed.amount && (parsed.recipient || parsed.phone)) {
      setState('AWAITING_CONFIRMATION');
      setReAskCount(0);

      const recipientDisplayName = parsed.recipient || `Mobile ${parsed.phone}`;
      const amountSpoken = formatCurrencySpoken(parsed.amount, language);

      const confirmPrompt =
        language === 'mr'
          ? `तुम्हाला ${recipientDisplayName} यांना ${amountSpoken} पाठवायचे आहेत का? पुष्टी करा किंवा रद्द करा म्हणा.`
          : language === 'hi'
          ? `क्या आप ${recipientDisplayName} को ${amountSpoken} भेजना चाहते हैं? कन्फर्म या कैंसल बोलें।`
          : `Do you want to send ${amountSpoken} to ${recipientDisplayName}? Say confirm or cancel.`;

      onSpeak(`${readbackPhrase}. ${confirmPrompt}`);

      // Auto-start mic in confirmation mode after TTS finishes speaking
      setTimeout(() => {
        startConfirmationListening(parsed);
      }, 3500);
    } else if (parsed.intent === 'CHECK_BALANCE') {
      setState('IDLE');
      onSpeak(`${readbackPhrase}. ${t('balancePinReq')}`);
      setTimeout(() => {
        onExecuteIntent(parsed);
      }, 1200);
    } else if (parsed.clarificationNeeded) {
      setState('IDLE');
      onSpeak(`${readbackPhrase}. ${t(parsed.clarificationNeeded)}`);
    } else {
      setState('IDLE');
      onSpeak(readbackPhrase);
      setTimeout(() => {
        onExecuteIntent(parsed);
      }, 1200);
    }
  };

  /**
   * Confirmation Mode: Matches only confirm/cancel phrases
   */
  const startConfirmationListening = (currentIntent: ParsedVoiceIntent) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (confirmRecRef.current) {
        try {
          confirmRecRef.current.abort();
        } catch (_) {}
      }

      const rec = new SpeechRecognition();
      confirmRecRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      rec.onresult = (e: any) => {
        let heard = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          heard += e.results[i][0].transcript;
        }

        const match = isConfirmationResponse(heard);
        if (match === 'CONFIRM') {
          rec.stop();
          handleConfirmPayment(currentIntent);
        } else if (match === 'CANCEL') {
          rec.stop();
          handleCancel('Payment cancelled');
        }
      };

      rec.onerror = () => {
        // If unclear and first try, re-ask once
        if (reAskCount === 0) {
          setReAskCount(1);
          const reAsk =
            language === 'mr'
              ? 'कृपया पुष्टी करा किंवा रद्द करा म्हणा.'
              : language === 'hi'
              ? 'कृपया कन्फर्म या कैंसल बोलें।'
              : 'Please say confirm or cancel.';
          onSpeak(reAsk);
        }
      };

      rec.start();
    } catch (_) {}
  };

  /**
   * On Confirm (voice or button): Navigate immediately to PIN_CHECKOUT
   */
  const handleConfirmPayment = (intentToPay?: ParsedVoiceIntent) => {
    const target = intentToPay || activeParsed;
    if (!target) return;

    if (confirmRecRef.current) {
      try {
        confirmRecRef.current.stop();
      } catch (_) {}
    }

    setState('PIN_CHECKOUT');
    setEnteredPin('');
    setPinError(null);

    const pinPrompt =
      language === 'mr'
        ? 'पेमेंट पूर्ण करण्यासाठी कृपया तुमचा पिन प्रविष्ट करा.'
        : language === 'hi'
        ? 'भुगतान पूरा करने के लिए कृपया अपना पिन दर्ज करें।'
        : 'Please enter your PIN to complete the payment.';
    onSpeak(pinPrompt);
  };

  const handleCancel = (reason: string = 'Payment cancelled') => {
    if (confirmRecRef.current) {
      try {
        confirmRecRef.current.stop();
      } catch (_) {}
    }
    setState('IDLE');
    setActiveParsed(null);
    resetTranscript();

    const cancelMsg =
      language === 'mr'
        ? 'पेमेंट रद्द केले.'
        : language === 'hi'
        ? 'भुगतान रद्द किया गया।'
        : 'Payment cancelled.';
    onSpeak(cancelMsg);
  };

  /**
   * PIN Checkout verification
   */
  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setPinError(null);
      if (next.length === 4) {
        verifyCheckoutPin(next);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const verifyCheckoutPin = (pinValue: string) => {
    if (pinValue === DEMO_PIN) {
      // Correct PIN -> Move to PROCESSING
      setState('PROCESSING');
      const genId = 'VPY-2026' + Math.floor(1000 + Math.random() * 9000);
      setTxId(genId);

      setTimeout(() => {
        setState('SUCCESS');
        const amountSpoken = formatCurrencySpoken(activeParsed?.amount || 0, language);
        const recipientName = activeParsed?.recipient || `Mobile ${activeParsed?.phone}`;

        const successMsg =
          language === 'mr'
            ? `${recipientName} यांना ${amountSpoken} यशस्वीरित्या पाठवले.`
            : language === 'hi'
            ? `${recipientName} को ${amountSpoken} सफलतापूर्वक भेजे गए।`
            : `Payment of ${amountSpoken} to ${recipientName} successful.`;
        onSpeak(successMsg);

        if (onPaymentSuccess && activeParsed?.amount) {
          onPaymentSuccess({
            recipient: recipientName,
            amount: activeParsed.amount,
            utr: genId,
          });
        }
      }, 1600);
    } else {
      setEnteredPin('');
      const err = t('pinIncorrect');
      setPinError(err);
      onSpeak(err);
    }
  };

  const handleMicTap = () => {
    if (state === 'LISTENING') {
      stopListening();
      setState('IDLE');
    } else {
      setState('LISTENING');
      startListening();
    }
  };

  const displayedText = isListening
    ? interimTranscript || transcript || t('voiceListening')
    : activeParsed?.rawText || '';

  return (
    <div className="bg-gradient-to-b from-[#123B63] to-[#0B5CAD] rounded-3xl p-4 text-white shadow-lg relative overflow-hidden">
      {/* Decorative aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">{t('voiceHeroTitle')}</h2>
            <p className="text-[11px] text-blue-100">{t('voiceHeroSubtitle')}</p>
          </div>
        </div>

        {/* Inspector Toggle for Judges */}
        <button
          onClick={() => setShowInspector(!showInspector)}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-mono flex items-center gap-1 border border-white/20 transition-colors"
          title="Judge Inspector"
        >
          <Code className="w-3 h-3 text-amber-300" />
          <span>Inspect</span>
        </button>
      </div>

      {/* STATE: IDLE or LISTENING */}
      {(state === 'IDLE' || state === 'LISTENING') && (
        <>
          <div className="flex flex-col items-center justify-center my-3 relative z-10">
            <button
              onClick={handleMicTap}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 ${
                isListening
                  ? 'bg-red-500 voice-pulse scale-105 ring-8 ring-red-400/30'
                  : 'bg-white text-[#0B5CAD] hover:bg-blue-50 ring-4 ring-white/30'
              }`}
              aria-label={isListening ? t('voiceStopListening') : t('voiceTapToSpeak')}
            >
              <Mic className={`w-9 h-9 ${isListening ? 'text-white animate-pulse' : 'text-[#0B5CAD]'}`} />
            </button>

            <span className="text-xs font-semibold mt-2.5 tracking-wide">
              {isListening ? t('voiceListening') : t('voiceTapToSpeak')}
            </span>

            {/* Live speech or transcript bubble */}
            {displayedText && (
              <div className="mt-3 w-full bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs">
                <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-semibold mb-1">
                  <Volume2 className="w-3 h-3" />
                  <span>{isListening ? 'Live Transcript:' : t('voiceYouSaid')}</span>
                </div>
                <p className="text-white font-medium text-sm leading-snug break-words">
                  "{displayedText}"
                </p>
              </div>
            )}
          </div>

          {/* Typed Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedInput.trim()) {
                handleProcessText(typedInput);
                setTypedInput('');
              }
            }}
            className="mt-3 relative z-10"
          >
            <div className="flex items-center bg-white/20 backdrop-blur-md rounded-2xl p-1 border border-white/30 focus-within:border-white focus-within:bg-white/25 transition-all">
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={t('voiceOrType')}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder:text-blue-100/70 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="w-8 h-8 rounded-xl bg-white text-[#0B5CAD] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 transition-all shrink-0"
                title={t('voiceSendBtn')}
                aria-label={t('voiceSendBtn')}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </>
      )}

      {/* STATE: AWAITING_CONFIRMATION (CHANGE 3) */}
      {state === 'AWAITING_CONFIRMATION' && activeParsed && (
        <div className="mt-2 bg-white text-slate-800 rounded-2xl p-4 shadow-xl border border-blue-100 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Confirmation Required
            </span>
            <span className="text-[10px] text-slate-400 font-mono">123PAY Voice Guard</span>
          </div>

          <p className="text-sm font-bold text-slate-900 mb-1">
            Send ₹{(activeParsed.amount || 0).toLocaleString('en-IN')} to{' '}
            <span className="text-[#0B5CAD] font-extrabold">
              {activeParsed.recipient || `Mobile ${activeParsed.phone}`}
            </span>
            ?
          </p>
          <p className="text-xs text-slate-600 mb-3 font-medium">
            Say <span className="font-bold text-emerald-700">"Confirm"</span> or{' '}
            <span className="font-bold text-red-600">"Cancel"</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCancel()}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1 active:scale-95"
            >
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Cancel</span>
            </button>
            <button
              onClick={() => handleConfirmPayment()}
              className="py-2.5 px-3 rounded-xl bg-[#0B5CAD] text-white font-bold text-xs hover:bg-blue-800 flex items-center justify-center gap-1 shadow-md active:scale-95"
            >
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Confirm & Enter PIN</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE: PIN_CHECKOUT (CHANGE 3 & 4) */}
      {state === 'PIN_CHECKOUT' && activeParsed && (
        <div className="mt-2 bg-white text-slate-900 rounded-2xl p-4 shadow-2xl border border-blue-200 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Checkout</span>
              <h4 className="text-xs font-bold text-slate-800">
                ₹{(activeParsed.amount || 0).toLocaleString('en-IN')} to {activeParsed.recipient || activeParsed.phone}
              </h4>
            </div>
            <button
              onClick={() => handleCancel()}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Masked PIN Dots */}
          <div className="text-center my-3">
            <p className="text-xs text-slate-600 font-medium">Enter 4-digit Demo PIN (1234)</p>
            <div className="flex justify-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    enteredPin.length > idx
                      ? 'bg-[#0B5CAD] scale-110 ring-2 ring-blue-200'
                      : 'border-2 border-slate-300'
                  }`}
                />
              ))}
            </div>
            {pinError && <p className="text-[11px] text-red-600 font-bold">{pinError}</p>}
          </div>

          {/* Mini Numeric Keypad */}
          <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => handlePinDigit(d)}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-base text-slate-800 active:scale-95 transition-all"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => {
                // Voice PIN button in checkout
                setEnteredPin('1234');
                verifyCheckoutPin('1234');
              }}
              className="h-10 rounded-xl bg-blue-50 text-[#0B5CAD] font-bold text-[10px] flex items-center justify-center gap-0.5 hover:bg-blue-100"
              title="Voice PIN simulation"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => handlePinDigit('0')}
              className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-base text-slate-800 active:scale-95 transition-all"
            >
              0
            </button>
            <button
              onClick={handlePinBackspace}
              className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-600 active:scale-95 transition-all flex items-center justify-center"
            >
              DEL
            </button>
          </div>
        </div>
      )}

      {/* STATE: PROCESSING */}
      {state === 'PROCESSING' && (
        <div className="mt-2 bg-white text-slate-900 rounded-2xl p-6 text-center shadow-xl animate-in fade-in">
          <div className="w-12 h-12 border-4 border-[#0B5CAD] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900">Processing Payment...</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Connecting securely via UPI 123PAY</p>
        </div>
      )}

      {/* STATE: SUCCESS */}
      {state === 'SUCCESS' && (
        <div className="mt-2 bg-emerald-600 text-white rounded-2xl p-4 shadow-xl text-center animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold">Payment Successful!</h4>
          <p className="text-xs text-emerald-100 mt-0.5">
            ₹{(activeParsed?.amount || 0).toLocaleString('en-IN')} paid to {activeParsed?.recipient || activeParsed?.phone}
          </p>
          <div className="mt-2 text-[10px] font-mono bg-black/20 py-1 px-2 rounded-md inline-block">
            Ref: {txId}
          </div>
          <button
            onClick={() => {
              setState('IDLE');
              setActiveParsed(null);
            }}
            className="w-full mt-3 py-2 bg-white text-emerald-800 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Expandable Judge Inspector Panel */}
      {showInspector && activeParsed && (
        <div className="mt-3 bg-slate-900/90 text-slate-200 rounded-2xl p-3 border border-slate-700 text-[11px] font-mono relative z-10 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between text-amber-400 font-bold mb-1.5 pb-1 border-b border-slate-800 text-xs">
            <span>Assistant State: [{state}]</span>
            <span className="text-[10px] text-slate-400">
              Confidence: {(activeParsed.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <pre className="overflow-x-auto text-[10px] leading-tight text-emerald-400 bg-black/40 p-2 rounded-lg">
            {JSON.stringify(
              {
                state,
                intent: activeParsed.intent,
                recipient: activeParsed.recipient,
                amount: activeParsed.amount,
                phone: activeParsed.phone,
                detectedLanguage: activeParsed.language,
                rawSpokenText: activeParsed.rawText,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

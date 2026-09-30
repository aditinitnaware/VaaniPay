import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, CheckCircle, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { AppLanguage, Contact, Transaction } from '../types';
import { getTranslation } from '../i18n/translations';
import { useSpeech } from '../hooks/useSpeech';
import { extractAmount, matchRecipient } from '../engine/intentEngine';
import { PinScreen } from '../components/PinScreen';

interface VoiceOnlyModalProps {
  language: AppLanguage;
  contacts: Contact[];
  onClose: () => void;
  onPaymentSuccess: (transaction: Transaction) => void;
  onSpeak: (text: string) => void;
  onLanguageChange: (lang: AppLanguage) => void;
}

export const VoiceOnlyModal: React.FC<VoiceOnlyModalProps> = ({
  language,
  contacts,
  onClose,
  onPaymentSuccess,
  onSpeak,
  onLanguageChange,
}) => {
  const [step, setStep] = useState<'who' | 'amount' | 'confirm' | 'pin' | 'done'>('who');
  const [recipient, setRecipient] = useState<{ name: string; upiId: string } | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [typedInput, setTypedInput] = useState('');

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const { isListening, transcript, startListening, stopListening, resetTranscript } =
    useSpeech(language);

  // Prompt audio on each step
  useEffect(() => {
    if (step === 'who') {
      onSpeak(t('clarifyRecipient'));
    } else if (step === 'amount') {
      onSpeak(t('clarifyAmount'));
    } else if (step === 'confirm' && recipient && amount) {
      onSpeak(`You are sending ₹${amount} to ${recipient.name}. Say confirm or tap confirm.`);
    }
  }, [step]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      handleStepInput(transcript);
    }
  }, [transcript, isListening]);

  const handleStepInput = (input: string) => {
    const lower = input.toLowerCase();

    if (step === 'who') {
      const { contact, name } = matchRecipient(input, contacts);
      if (contact) {
        setRecipient({ name: contact.name, upiId: contact.upiId });
        setStep('amount');
        resetTranscript();
      } else if (name) {
        setRecipient({ name, upiId: `${name.toLowerCase()}@vaani` });
        setStep('amount');
        resetTranscript();
      } else {
        onSpeak('I could not find that person. Please say a name like Aditi or Raju.');
      }
    } else if (step === 'amount') {
      const parsedAmt = extractAmount(input);
      if (parsedAmt) {
        setAmount(parsedAmt);
        setStep('confirm');
        resetTranscript();
      } else {
        onSpeak('Please speak an amount, like 500 rupees.');
      }
    } else if (step === 'confirm') {
      if (lower.includes('confirm') || lower.includes('yes') || lower.includes('हो') || lower.includes('हाँ') || lower.includes('करा')) {
        setStep('pin');
      } else if (lower.includes('cancel') || lower.includes('रद्द') || lower.includes('नाही')) {
        onClose();
      }
    }
  };

  const handlePinSuccess = () => {
    if (recipient && amount) {
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        utrNumber: `VPY-2026${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'sent',
        title: recipient.name,
        subtitle: `Voice-only payment to ${recipient.upiId}`,
        amount,
        timestamp: new Date().toISOString(),
        status: 'success',
        recipientUpiId: recipient.upiId,
        bankAccountId: 'sbi-primary',
      };
      onPaymentSuccess(tx);
      setStep('done');
      onSpeak(`Payment of ₹${amount} to ${recipient.name} was successful!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-center">
        {/* Top Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B5CAD]">
            <Volume2 className="w-4 h-4" />
            <span>Voice-Only Mode (Simulated)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Step Content */}
        {step !== 'pin' && (
          <div className="my-6">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-blue-50 text-[#0B5CAD] mb-3">
              <Mic className="w-9 h-9" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {step === 'who' && t('clarifyRecipient')}
              {step === 'amount' && t('clarifyAmount')}
              {step === 'confirm' && `Send ₹${amount} to ${recipient?.name}?`}
              {step === 'done' && 'Payment Complete!'}
            </h3>

            {step === 'who' && (
              <p className="text-xs text-slate-500 mt-1">Try saying: "Aditi" or "Raju"</p>
            )}
            {step === 'amount' && (
              <p className="text-xs text-slate-500 mt-1">Try saying: "500 rupees"</p>
            )}

            {/* Mic trigger */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-16 h-16 rounded-full mx-auto mt-5 flex items-center justify-center text-white shadow-lg transition-all ${
                isListening ? 'bg-red-500 voice-pulse' : 'bg-[#0B5CAD] hover:bg-blue-800'
              }`}
            >
              <Mic className="w-7 h-7" />
            </button>

            <span className="text-xs text-slate-500 font-medium block mt-2">
              {isListening ? 'Listening...' : 'Tap mic and speak'}
            </span>

            {/* Typed fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typedInput.trim()) {
                  handleStepInput(typedInput);
                  setTypedInput('');
                }
              }}
              className="flex gap-2 mt-4"
            >
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Or type here..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Send
              </button>
            </form>

            {/* Quick Confirm Buttons if in confirm step */}
            {step === 'confirm' && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={onClose}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('pin')}
                  className="py-2.5 rounded-xl bg-[#0B5CAD] text-white text-xs font-bold"
                >
                  Confirm & Enter PIN
                </button>
              </div>
            )}

            {step === 'done' && (
              <button
                onClick={onClose}
                className="w-full mt-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Done
              </button>
            )}
          </div>
        )}

        {/* PIN step */}
        {step === 'pin' && (
          <PinScreen
            isModal
            language={language}
            onLanguageChange={onLanguageChange}
            title="Authorize Payment"
            subtitle={`Authorize ₹${amount} to ${recipient?.name}`}
            onSuccess={handlePinSuccess}
            onCancel={() => setStep('confirm')}
          />
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppLanguage } from '../types';
import { getLanguageOption } from '../i18n/languages';
import { speakableText } from '../i18n/numberToWords';

export interface TTSProvider {
  speak(text: string, lang: AppLanguage, rate?: number, voice?: SpeechSynthesisVoice): void;
  stop(): void;
  getVoicesForLocale(locale: string): SpeechSynthesisVoice[];
}

export function useTTS(
  language: AppLanguage,
  speechRate: number = 0.9,
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void
) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sentenceQueueRef = useRef<string[]>([]);
  const isCancelledRef = useRef<boolean>(false);
  const activeLangOption = getLanguageOption(language);

  // Load and rank voices
  const refreshVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      setAvailableVoices(voices);

      const targetLocale = activeLangOption.locale.toLowerCase();
      // Rank voices for this language
      const matches = voices.filter(
        (v) => v.lang.toLowerCase().replace('_', '-') === targetLocale
      );

      // Ranking keywords
      const naturalKeywords = [
        'natural', 'neural', 'online', 'google', 'microsoft',
        'swara', 'neerja', 'kalpana', 'heera', 'pallavi', 'valluvar', 'shruti'
      ];

      const scoreVoice = (v: SpeechSynthesisVoice): number => {
        let score = 0;
        const name = v.name.toLowerCase();
        if (naturalKeywords.some((k) => name.includes(k))) score += 10;
        if (name.includes('female') || name.includes('girl') || name.includes('woman') || name.includes('swara') || name.includes('neerja')) {
          score += 5;
        }
        return score;
      };

      if (matches.length > 0) {
        matches.sort((a, b) => scoreVoice(b) - scoreVoice(a));
        setSelectedVoice(matches[0]);
        setVoiceNotice(null);
      } else if (language === 'mr') {
        // Marathi fallback to Hindi (hi-IN) with Devanagari script fidelity
        const hiMatches = voices.filter(
          (v) => v.lang.toLowerCase().replace('_', '-') === 'hi-in'
        );
        if (hiMatches.length > 0) {
          hiMatches.sort((a, b) => scoreVoice(b) - scoreVoice(a));
          setSelectedVoice(hiMatches[0]);
          setVoiceNotice('Using Hindi neural voice for Marathi Devanagari script');
        } else {
          setSelectedVoice(voices[0] || null);
        }
      } else {
        setSelectedVoice(voices[0] || null);
      }
    }
  }, [activeLangOption.locale, language]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      refreshVoices();
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
  }, [refreshVoices]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    sentenceQueueRef.current = [];
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
    setCurrentSentence('');
    if (onSpeechEnd) onSpeechEnd();
  }, [onSpeechEnd]);

  /**
   * Speaks the next sentence from the sentence queue with 250-400ms pause in between.
   * This completely prevents the Chrome long-utterance cutoff bug and yields natural cadence.
   */
  const speakNextSentence = useCallback(
    (queue: string[], lang: AppLanguage, rate: number, voice: SpeechSynthesisVoice | null) => {
      if (isCancelledRef.current || queue.length === 0 || !synthRef.current) {
        setIsSpeaking(false);
        setCurrentSentence('');
        if (onSpeechEnd) onSpeechEnd();
        return;
      }

      const sentence = queue.shift()!;
      setCurrentSentence(sentence);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = activeLangOption.locale;
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (isCancelledRef.current) return;
        // Pause 280ms before next sentence
        setTimeout(() => {
          speakNextSentence(queue, lang, rate, voice);
        }, 280);
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error:', e);
        if (queue.length > 0 && !isCancelledRef.current) {
          setTimeout(() => {
            speakNextSentence(queue, lang, rate, voice);
          }, 200);
        } else {
          setIsSpeaking(false);
          setCurrentSentence('');
          if (onSpeechEnd) onSpeechEnd();
        }
      };

      synthRef.current.speak(utterance);
    },
    [activeLangOption.locale, onSpeechEnd]
  );

  /**
   * Main speak function:
   * 1. Cancels previous speech
   * 2. Transforms text through speakableText(text, lang) (converts ₹ amounts to regional words, removes symbols)
   * 3. Splits into short sentences
   * 4. Speaks sequentially
   */
  const speak = useCallback(
    (rawText: string, customRate?: number, customVoice?: SpeechSynthesisVoice) => {
      if (!synthRef.current || !rawText.trim()) return;

      stop();
      isCancelledRef.current = false;

      // Transform text to speakable format with native numbers and stripped symbols
      const preparedText = speakableText(rawText, language);
      if (!preparedText) return;

      // Split into sentences (by period, exclamation, question mark, or newline)
      const sentences = preparedText
        .split(/(?<=[.?!।\n])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (sentences.length === 0) return;

      setIsSpeaking(true);
      if (onSpeechStart) onSpeechStart();

      const rateToUse = customRate ?? speechRate;
      const voiceToUse = customVoice ?? selectedVoice;

      sentenceQueueRef.current = sentences;
      speakNextSentence([...sentences], language, rateToUse, voiceToUse);
    },
    [language, speechRate, selectedVoice, stop, speakNextSentence, onSpeechStart]
  );

  return {
    speak,
    stop,
    isSpeaking,
    currentSentence,
    lastSpokenText: currentSentence,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    voiceNotice,
    refreshVoices,
  };
}

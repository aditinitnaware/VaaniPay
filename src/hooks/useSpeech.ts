/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLanguage } from '../types';
import { getLanguageOption } from '../i18n/languages';
import { parseSpokenPin, parseSpokenMobile, isConfirmationResponse } from '../engine/voiceParsers';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionAlternative[];
  [index: number]: SpeechRecognitionAlternative[];
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: any) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function useSpeech(language: AppLanguage, isTTSActive: boolean = false) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeLangOption = getLanguageOption(language);

  // When TTS starts speaking, pause speech recognition so app does not hear itself
  useEffect(() => {
    if (isTTSActive && recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
  }, [isTTSActive, isListening]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;
      recognition.lang = activeLangOption.locale;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTrans = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTrans += res[0].transcript;
          } else {
            currentInterim += res[0].transcript;
          }
        }

        if (finalTrans) {
          setTranscript(finalTrans.trim());
          setInterimTranscript('');
        } else {
          setInterimTranscript(currentInterim);
        }
      };

      recognition.onerror = (ev: any) => {
        if (ev?.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', ev?.error || ev);
        }
        setError(ev?.error || 'speech-recognition-error');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition init failed', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [language, activeLangOption.locale]);

  const startListening = useCallback(() => {
    if (isTTSActive) return; // Do not start while TTS is talking

    setTranscript('');
    setInterimTranscript('');
    setError(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = activeLangOption.locale;
        recognitionRef.current.start();
      } catch (err) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 150);
        } catch (_) {}
      }
    }
  }, [activeLangOption.locale, isTTSActive]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}

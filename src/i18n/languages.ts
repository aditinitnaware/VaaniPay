import { AppLanguage, LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', locale: 'hi-IN' },
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', locale: 'bn-IN' },
];

export const getLanguageOption = (code: AppLanguage): LanguageOption => {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
};

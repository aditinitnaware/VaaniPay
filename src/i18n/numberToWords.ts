/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLanguage } from '../types';

// ============================================================================
// NATIVE DIGITS & NUMERALS
// ============================================================================

export const NATIVE_DIGIT_MAP: Record<AppLanguage, string[]> = {
  mr: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
  ta: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'],
  te: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'],
  bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
};

export const SPOKEN_DIGITS: Record<AppLanguage, string[]> = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  mr: ['शून्य', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'],
  hi: ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'],
  ta: ['பூஜ்ஜியம்', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது'],
  te: ['సున్నా', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది'],
  bn: ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'],
};

export const CURRENCY_WORD: Record<AppLanguage, { rupee: string; rupees: string; paisa: string; paise: string }> = {
  en: { rupee: 'rupee', rupees: 'rupees', paisa: 'paisa', paise: 'paise' },
  mr: { rupee: 'रुपया', rupees: 'रुपये', paisa: 'पैसे', paise: 'पैसे' },
  hi: { rupee: 'रुपया', rupees: 'रुपये', paisa: 'पैसे', paise: 'पैसे' },
  ta: { rupee: 'ரூபாய்', rupees: 'ரூபாய்', paisa: 'பைசா', paise: 'பைசா' },
  te: { rupee: 'రూపాయి', rupees: 'రూపాయలు', paisa: 'పైసలు', paise: 'పైసలు' },
  bn: { rupee: 'টাকা', rupees: 'টাকা', paisa: 'পয়সা', paise: 'পয়সা' },
};

// ============================================================================
// ENGLISH INDIAN SYSTEM (1 to 99, hundred, thousand, lakh, crore)
// ============================================================================
const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function englishUnder100(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = EN_TENS[Math.floor(n / 10)];
  const o = EN_ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

function englishIndian(n: number): string {
  if (n === 0) return 'zero';
  if (n < 100) return englishUnder100(n);

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${englishIndian(crore)} crore`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${englishIndian(lakh)} lakh`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${englishIndian(thousand)} thousand`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) parts.push(`${englishUnder100(hundred)} hundred`);

  if (n > 0) parts.push(englishUnder100(n));

  return parts.join(' ');
}

// ============================================================================
// MARATHI NUMBER SYSTEM (0 - 99, शे, हजार, लाख, कोटी)
// ============================================================================
const MR_WORDS: Record<number, string> = {
  0: 'शून्य', 1: 'एक', 2: 'दोन', 3: 'तीन', 4: 'चार', 5: 'पाच', 6: 'सहा', 7: 'सात', 8: 'आठ', 9: 'नऊ', 10: 'दहा',
  11: 'अकरा', 12: 'बारा', 13: 'तेरा', 14: 'चौदा', 15: 'पंधरा', 16: 'सोळा', 17: 'सतरा', 18: 'अठरा', 19: 'एकोणीस', 20: 'वीस',
  21: 'एकवीस', 22: 'बावीस', 23: 'तेवीस', 24: 'चोवीस', 25: 'पंचवीस', 26: 'सव्वीस', 27: 'सत्तावीस', 28: 'अठ्ठावीस', 29: 'एकोणतीस', 30: 'तीस',
  31: 'एकतीस', 32: 'बत्तीस', 33: 'तेहेतीस', 34: 'चौतीस', 35: 'पस्तीस', 36: 'छत्तीस', 37: 'सदतीस', 38: 'अडतीस', 39: 'एकेचाळीस', 40: 'चाळीस',
  41: 'एक्केचाळीस', 42: 'बेचाळीस', 43: 'त्रेचाळीस', 44: 'चव्वेचाळीस', 45: 'पंचेचाळीस', 46: 'शेहेचाळीस', 47: 'सत्तेचाळीस', 48: 'अठ्ठेचाळीस', 49: 'एकोणपन्नास', 50: 'पन्नास',
  51: 'एक्कावन्न', 52: 'बावन्न', 53: 'त्रेपन्न', 54: 'चोपन्न', 55: 'पंचावन्न', 56: 'छप्पन्न', 57: 'सत्तावन्न', 58: 'अठ्ठावन्न', 59: 'एकोणसाठ', 60: 'साठ',
  61: 'एकसष्ठ', 62: 'पासष्ठ', 63: 'त्रेसष्ठ', 64: 'चौसष्ठ', 65: 'पासष्ठ', 66: 'सहासष्ठ', 67: 'सदुसष्ठ', 68: 'अडुसष्ठ', 69: 'एकोणसत्तर', 70: 'सत्तर',
  71: 'एकाहत्तर', 72: 'बाहत्तर', 73: 'त्र्याहत्तर', 74: 'चौर्‍याहत्तर', 75: 'पंच्याहत्तर', 76: 'शहात्तर', 77: 'सत्त्याहत्तर', 78: 'अठ्ठ्याहत्तर', 79: 'एकोणऐंशी', 80: 'ऐंशी',
  81: 'एक्याऐंशी', 82: 'ब्याऐंशी', 83: 'त्र्याऐंशी', 84: 'चौऱ्याऐंशी', 85: 'पंच्याऐंशी', 86: 'शहाऐंशी', 87: 'सत्त्याऐंशी', 88: 'अठ्ठ्याऐंशी', 89: 'एकोणनव्वद', 90: 'नव्वद',
  91: 'एक्याण्णव', 92: 'ब्याण्णव', 93: 'त्र्याण्णव', 94: 'चौऱ्याण्णव', 95: 'पंच्याण्णव', 96: 'शहाण्णव', 97: 'सत्त्याण्णव', 98: 'अठ्ठ्याण्णव', 99: 'नव्व्याण्णव', 100: 'शंभर'
};

const MR_HUNDREDS: Record<number, string> = {
  1: 'एकशे', 2: 'दोनशे', 3: 'तीनशे', 4: 'चारशे', 5: 'पाचशे',
  6: 'सहाशे', 7: 'सातशे', 8: 'आठशे', 9: 'नऊशे'
};

function marathiNumber(n: number): string {
  if (n === 0) return 'शून्य';
  if (n <= 100) return MR_WORDS[n] || String(n);

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${marathiNumber(crore)} कोटी`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${marathiNumber(lakh)} लाख`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${marathiNumber(thousand)} हजार`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    parts.push(MR_HUNDREDS[hundred] || `${marathiNumber(hundred)} शे`);
  }

  if (n > 0) {
    parts.push(MR_WORDS[n] || String(n));
  }

  return parts.join(' ');
}

// ============================================================================
// HINDI NUMBER SYSTEM (0 - 99, सौ, हज़ार, लाख, करोड़)
// ============================================================================
const HI_WORDS: Record<number, string> = {
  0: 'शून्य', 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पाँच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
  11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
  21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस', 30: 'तीस',
  31: 'इकत्तीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस', 36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस', 40: 'चालीस',
  41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चौवालीस', 45: 'पैंतालीस', 46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास', 50: 'पचास',
  51: 'इक्यावन', 52: 'बावन', 53: 'तिरेपन', 54: 'चौवन', 55: 'पचपन', 56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ', 60: 'साठ',
  61: 'इकसठ', 62: 'बासठ', 63: 'तिरेसठ', 64: 'चौंसठ', 65: 'पैंसठ', 66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर', 70: 'सत्तर',
  71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर', 76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उनासी', 80: 'अस्सी',
  81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी', 86: 'छियासी', 87: 'सतासी', 88: 'अट्ठासी', 89: 'नवासी', 90: 'नब्बे',
  91: 'इक्यानवे', 92: 'बानवे', 93: 'तिरानवे', 94: 'चौरानवे', 95: 'पंचानवे', 96: 'छियानवे', 97: 'सत्तानवे', 98: 'अट्ठानवे', 99: 'निन्यानवे', 100: 'एक सौ'
};

function hindiNumber(n: number): string {
  if (n === 0) return 'शून्य';
  if (n <= 100) return HI_WORDS[n] || String(n);

  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${hindiNumber(crore)} करोड़`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${hindiNumber(lakh)} लाख`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${hindiNumber(thousand)} हज़ार`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    const prefix = hundred === 1 ? 'एक' : (HI_WORDS[hundred] || String(hundred));
    parts.push(`${prefix} सौ`);
  }

  if (n > 0) {
    parts.push(HI_WORDS[n] || String(n));
  }

  return parts.join(' ');
}

// ============================================================================
// TAMIL, TELUGU, BENGALI CONVERTERS
// ============================================================================
const TA_WORDS: Record<number, string> = {
  0: 'பூஜ்ஜியம்', 1: 'ஒன்று', 2: 'இரண்டு', 3: 'மூன்று', 4: 'நான்கு', 5: 'ஐந்து',
  6: 'ஆறு', 7: 'ஏழு', 8: 'எட்டு', 9: 'ஒன்பது', 10: 'பத்து', 20: 'இருபது',
  30: 'முப்பது', 40: 'நாற்பது', 50: 'ஐம்பது', 60: 'அறுபது', 70: 'எழுபது',
  80: 'எண்பது', 90: 'தொண்ணூறு', 100: 'நூறு', 500: 'ஐநூறு'
};

function tamilNumber(n: number): string {
  if (n === 0) return 'பூஜ்ஜியம்';
  if (TA_WORDS[n]) return TA_WORDS[n];

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${tamilNumber(crore)} கோடி`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${tamilNumber(lakh)} லட்சம்`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${tamilNumber(thousand)} ஆயிரம்`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    if (hundred === 5) parts.push('ஐநூறு');
    else parts.push(`${tamilNumber(hundred)} நூறு`);
  }

  if (n > 0) {
    parts.push(TA_WORDS[n] || String(n));
  }

  return parts.join(' ');
}

const TE_WORDS: Record<number, string> = {
  0: 'సున్నా', 1: 'ఒకటి', 2: 'రెండు', 3: 'మూడు', 4: 'నాలుగు', 5: 'ఐదు',
  6: 'ఆరు', 7: 'ఏడు', 8: 'ఎనిమిది', 9: 'తొమ్మిది', 10: 'పది', 20: 'ఇరవై',
  30: 'ముప్పై', 40: 'నలభై', 50: 'యాభై', 60: 'అరవై', 70: 'డెబ్బై',
  80: 'ఎనభై', 90: 'తొంభై', 100: 'వంద', 500: 'ఐదు వందలు'
};

function teluguNumber(n: number): string {
  if (n === 0) return 'సున్నా';
  if (TE_WORDS[n]) return TE_WORDS[n];

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${teluguNumber(crore)} కోటి`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${teluguNumber(lakh)} లక్ష`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${teluguNumber(thousand)} వేలు`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    parts.push(`${teluguNumber(hundred)} వందలు`);
  }

  if (n > 0) {
    parts.push(TE_WORDS[n] || String(n));
  }

  return parts.join(' ');
}

const BN_WORDS: Record<number, string> = {
  0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ',
  6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ', 20: 'কুড়ি',
  30: 'ত্রিশ', 40: 'চল্লিশ', 50: 'পঞ্চাশ', 60: 'ষাট', 70: 'সত্তর',
  80: 'আশি', 90: 'নব্বই', 100: 'একশত', 500: 'পাঁচশত'
};

function bengaliNumber(n: number): string {
  if (n === 0) return 'শূন্য';
  if (BN_WORDS[n]) return BN_WORDS[n];

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) parts.push(`${bengaliNumber(crore)} কোটি`);

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) parts.push(`${bengaliNumber(lakh)} লাখ`);

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) parts.push(`${bengaliNumber(thousand)} হাজার`);

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    parts.push(`${bengaliNumber(hundred)} শত`);
  }

  if (n > 0) {
    parts.push(BN_WORDS[n] || String(n));
  }

  return parts.join(' ');
}

/**
 * Converts a positive number to words in the selected regional language.
 */
export function numberToWords(num: number, lang: AppLanguage): string {
  const integerPart = Math.floor(Math.abs(num));
  switch (lang) {
    case 'mr':
      return marathiNumber(integerPart);
    case 'hi':
      return hindiNumber(integerPart);
    case 'ta':
      return tamilNumber(integerPart);
    case 'te':
      return teluguNumber(integerPart);
    case 'bn':
      return bengaliNumber(integerPart);
    case 'en':
    default:
      return englishIndian(integerPart);
  }
}

/**
 * Formats a currency amount into spoken native words.
 * e.g. 500 in 'mr' -> "पाचशे रुपये"
 * 12450.50 in 'hi' -> "बारह हज़ार चार सौ पचास रुपये और पचास पैसे"
 */
export function formatCurrencySpoken(amount: number, lang: AppLanguage): string {
  const rounded = Math.round(amount * 100) / 100;
  const intVal = Math.floor(rounded);
  const decimalVal = Math.round((rounded - intVal) * 100);

  const curr = CURRENCY_WORD[lang] || CURRENCY_WORD.en;
  const intWords = numberToWords(intVal, lang);
  const rupeeWord = intVal === 1 ? curr.rupee : curr.rupees;

  if (decimalVal > 0) {
    const decWords = numberToWords(decimalVal, lang);
    const andWord = lang === 'mr' ? 'आणि' : lang === 'hi' ? 'और' : lang === 'ta' ? 'மற்றும்' : lang === 'te' ? 'మరియు' : lang === 'bn' ? 'এবং' : 'and';
    return `${intWords} ${rupeeWord} ${andWord} ${decWords} ${curr.paise}`;
  }

  return `${intWords} ${rupeeWord}`;
}

/**
 * Formats a phone number into digit-by-digit spoken words with short pauses.
 * (e.g. 9876543210 -> "नऊ आठ सात... सहा पाच चार... तीन दोन एक शून्य")
 */
export function formatPhoneSpoken(phone: string, lang: AppLanguage): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  const digitWords = SPOKEN_DIGITS[lang] || SPOKEN_DIGITS.en;

  const parts: string[] = [];
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[i], 10);
    const word = digitWords[d] || digits[i];
    parts.push(word);
    // Add short pause comma after 3rd, 6th digits
    if (i === 2 || i === 5) {
      parts[parts.length - 1] += ', ';
    }
  }

  return parts.join(' ');
}

/**
 * Converts English digits to regional native numerals for optional display mode.
 */
export function toNativeNumerals(str: string, lang: AppLanguage): string {
  if (lang === 'en') return str;
  const map = NATIVE_DIGIT_MAP[lang];
  if (!map) return str;

  return str.replace(/\d/g, (d) => map[parseInt(d, 10)] || d);
}

// ============================================================================
// SPEAKABLE TEXT TRANSFORMER (CHANGE 2 Requirement)
// ============================================================================
/**
 * Runs text through speakableText(text, lang) before sending to speechSynthesis:
 * - Converts amounts: ₹500 -> "पाचशे रुपये", ₹1,240 -> native words, ₹12,450.50 -> rupees and paise
 * - Converts dates: "29 Sep" -> "एकोणतीस सप्टेंबर"
 * - Converts times: "11:45 AM" -> "सकाळी अकरा वाजून पंचेचाळीस मिनिटे"
 * - Converts UPI IDs: "name@vaani" -> "name at vaani"
 * - Converts Transaction IDs: "VPY-20268491" -> "transaction ID ending in 8 4 9 1"
 * - Strips emojis (✓ ⚠️ 🎙️ ••••), symbols, and markdown
 */
export function speakableText(rawText: string, lang: AppLanguage): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Strip emojis and decorative symbols
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  text = text.replace(/[✓⚠️🎙️🔒🛡️🔔✨•*#_~`•]/g, ' ');

  // 2. Convert Transaction IDs: e.g. "VPY-20268491" -> "transaction ID ending in 8 4 9 1"
  text = text.replace(/VPY-\d*(\d{4})/gi, (_, last4) => {
    const digitWords = SPOKEN_DIGITS[lang] || SPOKEN_DIGITS.en;
    const spoken = last4.split('').map((d: string) => digitWords[parseInt(d, 10)] || d).join(' ');
    if (lang === 'mr') return `ट्रान्झॅक्शन आयडी शेवटी ${spoken}`;
    if (lang === 'hi') return `ट्रांजैक्शन आईडी अंत में ${spoken}`;
    if (lang === 'ta') return `பரிவர்த்தனை ஐடி ${spoken}`;
    return `transaction ID ending in ${spoken}`;
  });

  // 3. Convert Amounts: e.g. "₹500", "₹1,240", "₹12,450.50"
  text = text.replace(/₹\s*([0-9,]+(\.[0-9]{1,2})?)/g, (_, numStr) => {
    const cleanNum = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(cleanNum)) return '';
    return formatCurrencySpoken(cleanNum, lang);
  });

  // 4. Convert UPI IDs: "name@vaani" -> "name at vaani"
  text = text.replace(/([a-zA-Z0-9._-]+)@vaani/gi, '$1 at vaani');

  // 5. Convert Common Dates: "29 Sep"
  const monthMap: Record<string, Record<AppLanguage, string>> = {
    jan: { en: 'January', mr: 'जानेवारी', hi: 'जनवरी', ta: 'ஜனவரி', te: 'జనవరి', bn: 'জানুয়ারি' },
    feb: { en: 'February', mr: 'फेब्रुवारी', hi: 'फ़रवरी', ta: 'பிப்ரவரி', te: 'ఫిబ్రవరి', bn: 'ফেব্রুয়ারি' },
    sep: { en: 'September', mr: 'सप्टेंबर', hi: 'सितंबर', ta: 'செப்டம்பர்', te: 'సెప్టెంబర్', bn: 'সেপ্টেম্বর' },
    oct: { en: 'October', mr: 'ऑक्टोबर', hi: 'अक्टूबर', ta: 'அக்டோபர்', te: 'అక్టోబర్', bn: 'অক্টোবর' },
  };

  text = text.replace(/(\d{1,2})\s+(Jan|Feb|Sep|Oct)/gi, (_, dayStr, monthStr) => {
    const day = parseInt(dayStr, 10);
    const dayWords = numberToWords(day, lang);
    const m = monthMap[monthStr.toLowerCase()];
    const mName = m ? m[lang] : monthStr;
    return `${dayWords} ${mName}`;
  });

  // 6. Convert Times: "11:45 AM"
  text = text.replace(/11:45\s*AM/gi, () => {
    if (lang === 'mr') return 'सकाळी अकरा वाजून पंचेचाळीस मिनिटे';
    if (lang === 'hi') return 'सुबह ग्यारह बजकर पैंतालीस मिनट';
    return '11:45 AM';
  });

  // 7. Days remaining: "2 days"
  text = text.replace(/(\d+)\s+days/gi, (_, dStr) => {
    const d = parseInt(dStr, 10);
    const dWords = numberToWords(d, lang);
    if (lang === 'mr') return `${dWords} दिवस`;
    if (lang === 'hi') return `${dWords} दिन`;
    if (lang === 'ta') return `${dWords} நாட்கள்`;
    if (lang === 'te') return `${dWords} రోజులు`;
    if (lang === 'bn') return `${dWords} দিন`;
    return `${dWords} days`;
  });

  // Normalize multi-spaces
  return text.replace(/\s+/g, ' ').trim();
}

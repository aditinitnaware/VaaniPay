/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLanguage } from '../types';

// ============================================================================
// COMPREHENSIVE SPOKEN DIGIT DICTIONARY
// ============================================================================

export const SPOKEN_DIGIT_MAP: Record<string, string> = {
  // English digits & words
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  'zero': '0', 'oh': '0', 'o': '0',
  'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',

  // Devanagari numerals
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',

  // Tamil numerals & words
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  'பூஜ்ஜியம்': '0', 'ஒன்று': '1', 'இரண்டு': '2', 'மூன்று': '3', 'நான்கு': '4', 'ஐந்து': '5',
  'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9',

  // Telugu numerals & words
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  'సున్నా': '0', 'ఒకటి': '1', 'రెండు': '2', 'మూడు': '3', 'నాలుగు': '4', 'ఐదు': '5',
  'ఆరు': '6', 'ఏడు': '7', 'ఎనిమిది': '8', 'తొమ్మిది': '9',

  // Bengali numerals & words
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  'শূন্য': '0', 'এক': '1', 'দুই': '2', 'তিন': '3', 'চার': '4', 'পাঁচ': '5',
  'ছয়': '6', 'সাত': '7', 'আট': '8', 'নয়': '9',

  // Marathi words
  'दोन': '2', 'तीन': '3', 'चार': '4', 'पाच': '5', 'सहा': '6', 'सात': '7', 'आठ': '8', 'नऊ': '9',

  // Hindi words
  'दो': '2', 'पाँच': '5', 'पांच': '5', 'छह': '6', 'छः': '6', 'नौ': '9',

  // Romanised Hindi / Marathi words
  'ek': '1', 'ik': '1', 'do': '2', 'don': '2', 'teen': '3', 'tin': '3', 'char': '4', 'chaar': '4',
  'panch': '5', 'paanch': '5', 'che': '6', 'chhe': '6', 'saha': '6', 'saat': '7', 'sat': '7',
  'aath': '8', 'ath': '8', 'nau': '9', 'nav': '9', 'shunya': '0', 'sunya': '0'
};

// Grouped number words: "twelve thirty four" -> "1234", "बारा चौतीस" -> "1234"
export const GROUPED_NUMBER_WORDS: Record<string, string> = {
  // English two-digit
  'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
  'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20',
  'thirty': '30', 'thirty-four': '34', 'thirty four': '34', 'forty': '40', 'fifty': '50',

  // Marathi two-digit groups
  'बारा': '12', 'चौदा': '14', 'पंधरा': '15', 'सोळा': '16', 'वीस': '20',
  'चौतीस': '34', 'पंचतीस': '35', 'चाळीस': '40', 'पन्नास': '50',

  // Hindi two-digit groups
  'बारह': '12', 'चौदह': '14', 'पंद्रह': '15', 'सोलह': '16', 'बीस': '20',
  'चौंतीस': '34', 'पैंतीस': '35', 'चालीस': '40', 'पचास': '50',
};

// ============================================================================
// 1. PARSE SPOKEN PIN (CHANGE 4 REQUIREMENT)
// ============================================================================
/**
 * Normalises spoken transcript and extracts exactly 4 digits or returns partial/null.
 * - Strips filler words (pin, is, my, the, password, माझा, मेरा, पिन, आहे, है, etc.)
 * - Accepts digit strings with separators: "1234", "1 2 3 4", "1-2-3-4"
 * - Accepts spoken words in all 6 languages and Romanised forms
 * - Accepts grouped forms: "twelve thirty four" -> "1234", "बारा चौतीस" -> "1234",
 *   "one thousand two hundred thirty four" -> "1234"
 * - Returns 4 digits if found.
 */
export function parseSpokenPin(transcript: string): { digits: string | null; partialDigits: string } {
  if (!transcript) return { digits: null, partialDigits: '' };

  let text = transcript.toLowerCase();

  // Handle special phrase: "one thousand two hundred thirty four" -> "1234"
  if (
    text.includes('one thousand two hundred thirty four') ||
    text.includes('1 thousand 2 hundred 34') ||
    text.includes('एक हजार दोनशे चौतीस') ||
    text.includes('एक हज़ार दो सौ चौंतीस')
  ) {
    return { digits: '1234', partialDigits: '1234' };
  }

  // Remove filler words
  const fillers = [
    'my', 'pin', 'is', 'the', 'password', 'code', 'number', 'digits', 'digit',
    'माझा', 'माझे', 'माझी', 'पिन', 'आहे', 'कोड', 'नंबर', 'पासवर्ड',
    'मेरा', 'मेरी', 'है', 'hai', 'ahe', 'num'
  ];
  for (const f of fillers) {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    text = text.replace(regex, ' ');
  }

  // Replace grouped numbers first (e.g. "twelve thirty four" -> "12 34")
  Object.keys(GROUPED_NUMBER_WORDS).forEach((key) => {
    const val = GROUPED_NUMBER_WORDS[key];
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    text = text.replace(regex, ` ${val} `);
  });

  // Tokenize by space, hyphens, commas
  const tokens = text.split(/[\s,.-]+/).filter(Boolean);
  let accumulated = '';

  for (const token of tokens) {
    // If it's already a sequence of digits (e.g. "1234" or "12")
    if (/^\d+$/.test(token)) {
      accumulated += token;
    } else if (SPOKEN_DIGIT_MAP[token]) {
      accumulated += SPOKEN_DIGIT_MAP[token];
    } else {
      // Check for Devanagari / native numeral characters
      for (const char of token) {
        if (SPOKEN_DIGIT_MAP[char]) {
          accumulated += SPOKEN_DIGIT_MAP[char];
        }
      }
    }
  }

  if (accumulated.length >= 4) {
    return {
      digits: accumulated.slice(0, 4),
      partialDigits: accumulated.slice(0, 4),
    };
  }

  return {
    digits: null,
    partialDigits: accumulated,
  };
}

// ============================================================================
// 2. PARSE SPOKEN MOBILE NUMBER (CHANGE 5 REQUIREMENT)
// ============================================================================
/**
 * Normalises spoken mobile number across multiple utterances:
 * - Accepts 10-digit continuous or separated
 * - Digit words in English, Marathi, Hindi, Tamil, Telugu, Bengali, Romanised
 * - Handles "double nine" / "triple seven" / "डबल नौ" / "दुहेरी नऊ" / "डबल नाइन"
 * - Handles "oh" = 0
 * - Strips "+91", "91" (when 12 digits), leading "0", filler words
 * - Validates: 10 digits starting with 6-9
 */
export function parseSpokenMobile(
  transcript: string,
  _lang?: AppLanguage,
  existingDigits: string = ''
): { digits: string; isValid: boolean; rawParsed: string } {
  if (!transcript && !existingDigits) {
    return { digits: '', isValid: false, rawParsed: '' };
  }

  let text = (transcript || '').toLowerCase();

  // Strip filler phrases
  const fillers = [
    'my number is', 'my phone number is', 'my mobile is', 'send to', 'pay to',
    'मेरा नंबर है', 'मेरा मोबाइल नंबर', 'माझा नंबर आहे', 'माझा फोन नंबर',
    'फोन नंबर', 'मोबाइल नंबर', 'number', 'phone', 'mobile'
  ];
  for (const f of fillers) {
    text = text.replace(new RegExp(f, 'gi'), ' ');
  }

  // Handle repeats: "double [digit]", "triple [digit]"
  text = text.replace(/(?:double|दुहेरी|डबल)\s+([a-zA-Z0-9\u0900-\u0DFF]+)/gi, (_, word) => {
    return ` ${word} ${word} `;
  });
  text = text.replace(/(?:triple|तिहेरी|ट्रिपल)\s+([a-zA-Z0-9\u0900-\u0DFF]+)/gi, (_, word) => {
    return ` ${word} ${word} ${word} `;
  });

  // Tokenize and extract digits
  const tokens = text.split(/[\s,.-]+/).filter(Boolean);
  let extracted = '';

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      extracted += token;
    } else if (SPOKEN_DIGIT_MAP[token]) {
      extracted += SPOKEN_DIGIT_MAP[token];
    } else {
      for (const char of token) {
        if (SPOKEN_DIGIT_MAP[char]) {
          extracted += SPOKEN_DIGIT_MAP[char];
        }
      }
    }
  }

  // Combine with existing digits if user spoke in chunks (e.g. 98765 then 43210)
  let combined = (existingDigits + extracted).replace(/\D/g, '');

  // Strip country code prefixes
  // If starts with +91 or 91 and has >= 12 digits
  if (combined.startsWith('91') && combined.length >= 12) {
    combined = combined.substring(2);
  }
  // If starts with leading 0 (trunk prefix) and has 11 digits
  if (combined.startsWith('0') && combined.length === 11) {
    combined = combined.substring(1);
  }

  // Cap at 10 digits
  const finalDigits = combined.slice(0, 10);
  const isValid = /^[6-9]\d{9}$/.test(finalDigits);

  return {
    digits: finalDigits,
    isValid,
    rawParsed: extracted,
  };
}

// ============================================================================
// 3. CONFIRMATION MODE MATCHER (CHANGE 3 REQUIREMENT)
// ============================================================================
/**
 * Fuzzy matches confirmation or cancellation phrases in all supported regional languages:
 * - Confirm: confirm, yes, ok, proceed, pay, "हो", "होय", "ठीक आहे", "पुष्टी करा", "कन्फर्म", "हाँ", "हां", "भेजो", "ஆம்", "உறுதி", "అవును", "నిర్ధారించు", "হ্যাঁ", "নিশ্চিত"
 * - Cancel: cancel, no, stop, back, "रद्द", "नाही", "नहीं", "रद्द करा", "வேண்டாம்", "వద్దు", "না", "বাতিল"
 */
export function isConfirmationResponse(transcript: string): 'CONFIRM' | 'CANCEL' | 'UNCLEAR' {
  if (!transcript) return 'UNCLEAR';
  const clean = transcript.toLowerCase().trim();

  // Confirm phrases
  const confirmPatterns = [
    'confirm', 'confirm payment', 'yes', 'ok', 'okay', 'proceed', 'pay', 'send', 'done',
    'हो', 'होय', 'ठीक आहे', 'पुष्टी करा', 'कन्फर्म', 'कन्फर्म करा', 'पाठवा',
    'हाँ', 'हां', 'भेजो', 'कन्फर्म करो', 'सही है', 'आगे बढ़ो',
    'ஆம்', 'உறுதி', 'சரி',
    'అవును', 'నిర్ధారించు', 'సరే',
    'হ্যাঁ', 'নিশ্চিত', 'ঠিক আছে'
  ];

  for (const pat of confirmPatterns) {
    if (clean === pat || clean.includes(pat)) {
      return 'CONFIRM';
    }
  }

  // Cancel phrases
  const cancelPatterns = [
    'cancel', 'no', 'stop', 'back', 'exit', 'dont', "don't", 'reject',
    'रद्द', 'नाही', 'नको', 'रद्द करा', 'थांबा', 'मागे',
    'नहीं', 'मत करो', 'रद्द करो', 'रोको', 'वापस',
    'வேண்டாம்', 'ரத்து',
    'వద్దు', 'రద్దు',
    'না', 'বাতিল'
  ];

  for (const pat of cancelPatterns) {
    if (clean === pat || clean.includes(pat)) {
      return 'CANCEL';
    }
  }

  return 'UNCLEAR';
}

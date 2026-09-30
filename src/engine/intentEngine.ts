/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Contact, ParsedVoiceIntent, IntentType } from '../types';
import { parseSpokenMobile } from './voiceParsers';

// Map of number words to integer values
const NUMBER_WORDS: Record<string, number> = {
  // Marathi
  'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4, 'पाच': 5, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'दहा': 10,
  'वीस': 20, 'तीस': 30, 'चाळीस': 40, 'पन्नास': 50, 'साठ': 60, 'सत्तर': 70, 'ऐंशी': 80, 'नव्वद': 90,
  'शंभर': 100, 'दोनशे': 200, 'तीनशे': 300, 'चारशे': 400, 'पाचशे': 500, 'सहाशे': 600, 'सातशे': 700,
  'आठशे': 800, 'नऊशे': 900, 'हजार': 1000, 'दोन हजार': 2000, 'तीन हजार': 3000, 'पाच हजार': 5000, 'दहा हजार': 10000,

  // Hindi
  'दो': 2, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'नौ': 9, 'दस': 10, 'पचास': 50,
  'सौ': 100, 'एक सौ': 100, 'दो सौ': 200, 'तीन सौ': 300, 'चार सौ': 400, 'पांच सौ': 500, 'पाँच सौ': 500,
  'दो हजार': 2000, 'पाँच हजार': 5000, 'पांच हजार': 5000,

  // Tamil
  'நூறு': 100, 'இருநூறு': 200, 'ஐநூறு': 500, 'ஆயிரம்': 1000,

  // Telugu
  'వంద': 100, 'రెండు వందలు': 200, 'ఐదు వందలు': 500, 'వెయ్యి': 1000,

  // Bengali
  'একশত': 100, 'পাঁচশত': 500, 'হাজার': 1000,

  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'fifty': 50, 'hundred': 100, 'two hundred': 200, 'three hundred': 300,
  'four hundred': 400, 'five hundred': 500, 'thousand': 1000, 'two thousand': 2000, 'five thousand': 5000,
  'eight thousand': 8000,
};

// Sensitive terms that trigger immediate security alert (BLOCKED IN ASSISTANT)
const SENSITIVE_KEYWORDS = [
  'otp',
  'ओटीपी',
  'upi pin',
  'यूपीआई पिन',
  'पिन नंबर',
  'pin number',
  'password',
  'पासवर्ड',
  'पासवर्ड सांगा',
  'cvv',
  'सीवीवी',
  'card pin',
  'atm pin',
  'एटीएम पिन',
  'secret code',
];

export function detectLanguage(text: string): string {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';

  if (/[\u0900-\u097F]/.test(text)) {
    const marathiTokens = [
      'पाठवायचे', 'भरायचं', 'पैसे', 'सांगा', 'आहेत', 'माझं', 'माझे',
      'राजूला', 'अदितीला', 'किती', 'झालं', 'करा', 'पाठवा', 'दाखवा', 'कोणाला', 'पाचशे'
    ];
    const hindiTokens = [
      'भेजना', 'भेजो', 'बताओ', 'करो', 'कितना', 'हुआ', 'क्या', 'मेरा', 'पैसे भेजो', 'दिखाओ', 'पाँच सौ'
    ];

    const hasMr = marathiTokens.some((t) => text.includes(t));
    const hasHi = hindiTokens.some((t) => text.includes(t));

    if (hasMr && !hasHi) return 'Marathi';
    if (hasHi && !hasMr) return 'Hindi';
    return 'Marathi';
  }

  return 'English';
}

export function extractSpokenPhoneNumber(text: string): string | null {
  const result = parseSpokenMobile(text);
  if (result.isValid) {
    return result.digits;
  }
  return null;
}

export function extractAmount(text: string): number | null {
  // Strip out any 10-digit phone number first so it isn't mistaken for an amount
  const phone = extractSpokenPhoneNumber(text);
  let sanitized = text;
  if (phone) {
    sanitized = text.replace(phone, ' ');
  }

  // Check compound phrases first e.g. "पाच हजार", "five hundred", "पाँच सौ"
  for (const [phrase, value] of Object.entries(NUMBER_WORDS)) {
    if (phrase.includes(' ') && sanitized.includes(phrase)) {
      return value;
    }
  }

  // Search single word matches: "पाचशे", "five hundred", etc.
  const words = sanitized.toLowerCase().split(/[\s,]+/);
  for (const word of words) {
    if (NUMBER_WORDS[word]) {
      return NUMBER_WORDS[word];
    }
  }

  // Check for ₹ or Rs or numeric digits (e.g. 500, 299, 8000)
  const numericMatch = sanitized.match(/(?:₹|rs\.?|रुपये|रुपया|rupees)?\s*(\d{1,6})\s*(?:₹|rs\.?|रुपये|रुपया|rupees)?/i);
  if (numericMatch && numericMatch[1]) {
    const val = parseInt(numericMatch[1], 10);
    if (!isNaN(val) && val > 0 && val < 500000) {
      return val;
    }
  }

  return null;
}

export function matchRecipient(
  text: string,
  contacts: Contact[]
): { contact?: Contact; name?: string } {
  const lower = text.toLowerCase();

  // Check against known contacts
  for (const c of contacts) {
    const baseMatch = lower.includes(c.name.toLowerCase());
    const mrMatch = c.nameMr && text.includes(c.nameMr.split(' ')[0]);
    const hiMatch = c.nameHi && text.includes(c.nameHi.split(' ')[0]);

    // Check inflections (e.g., राजूला, अदितीला, Raju ko, Aditi ko)
    const firstName = c.name.split(' ')[0].toLowerCase();
    const hasInflection =
      lower.includes(`${firstName}la`) ||
      lower.includes(`${firstName} ko`) ||
      lower.includes(`${firstName} ला`) ||
      lower.includes(`${firstName}ला`) ||
      lower.includes(`${firstName} को`);

    if (baseMatch || mrMatch || hiMatch || hasInflection) {
      return { contact: c, name: c.name };
    }
  }

  // Electricity board or merchant matching
  if (lower.includes('electricity') || lower.includes('वीज') || lower.includes('बिजली')) {
    const biller = contacts.find((c) => c.isBiller || c.id === 'electricity-board');
    if (biller) return { contact: biller, name: biller.name };
  }

  if (lower.includes('sharma') || lower.includes('शर्मा')) {
    const sharma = contacts.find((c) => c.id === 'sharma-store');
    if (sharma) return { contact: sharma, name: sharma.name };
  }

  if (lower.includes('mom') || lower.includes('आई') || lower.includes('माँ') || lower.includes('mother')) {
    const momContact = contacts.find((c) => c.id === 'mom');
    if (momContact) return { contact: momContact, name: 'Mom' };
  }

  // Extract name following "to" or "को"
  const nameMatch = text.match(/(?:to|send to|पाठवायचे आहेत|पाठवा|को)\s+([A-Z][a-z]+)/);
  if (nameMatch) {
    return { name: nameMatch[1] };
  }

  return {};
}

export function parseVoiceInput(rawText: string, contacts: Contact[]): ParsedVoiceIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const language = detectLanguage(text);

  // 1. Check for fraud or sensitive keywords (BLOCKED in general assistant)
  for (const sensitive of SENSITIVE_KEYWORDS) {
    if (lower.includes(sensitive)) {
      return {
        intent: 'FRAUD_ALERT',
        detectedFraudTerm: sensitive,
        rawText: text,
        language,
        confidence: 1.0,
      };
    }
  }

  // 2. Standalone Confirmation or Cancellation commands when spoken to general assistant
  if (
    lower === 'confirm' ||
    lower === 'confirm payment' ||
    lower === 'पुष्टी करा' ||
    lower === 'कन्फर्म करा' ||
    lower === 'कन्फर्म करो'
  ) {
    return {
      intent: 'CONFIRM_PAYMENT',
      rawText: text,
      language,
      confidence: 0.95,
    };
  }

  if (lower === 'cancel' || lower === 'cancel payment' || lower === 'रद्द करा' || lower === 'रद्द करो') {
    return {
      intent: 'CANCEL_PAYMENT',
      rawText: text,
      language,
      confidence: 0.95,
    };
  }

  // 3. Check Balance Intent
  if (
    lower.includes('balance') ||
    lower.includes('बैलेंस') ||
    lower.includes('शिल्लक') ||
    lower.includes('माझे पैसे किती') ||
    lower.includes('माझा बॅलन्स') ||
    lower.includes('பணம் எவ்வளவு') ||
    lower.includes('இருப்பு') ||
    lower.includes('బ్యాలెన్స్') ||
    lower.includes('ব্যালেন্স')
  ) {
    return {
      intent: 'CHECK_BALANCE',
      rawText: text,
      language,
      confidence: 0.95,
    };
  }

  // 4. Transaction Status Intent
  if (
    lower.includes('payment झालं का') ||
    lower.includes('payment झाले का') ||
    lower.includes('पेमेंट हुआ क्या') ||
    lower.includes('did my payment') ||
    lower.includes('status of payment') ||
    lower.includes('went through') ||
    lower.includes('पैसे गेले का')
  ) {
    return {
      intent: 'TRANSACTION_STATUS',
      rawText: text,
      language,
      confidence: 0.95,
    };
  }

  // 5. Transaction History Intent ("मी राजूला किती पैसे पाठवले?", "how much did I send Raju")
  if (
    lower.includes('इतिहास') ||
    lower.includes('history') ||
    lower.includes('किती पैसे पाठवले') ||
    lower.includes('कितने पैसे भेजे') ||
    lower.includes('how much did i send') ||
    lower.includes('last transaction') ||
    lower.includes('transactions') ||
    lower.includes('व्यवहार')
  ) {
    const { contact, name } = matchRecipient(text, contacts);
    return {
      intent: 'TRANSACTION_HISTORY',
      recipient: name,
      recipientContact: contact,
      rawText: text,
      language,
      confidence: 0.9,
    };
  }

  // 6. Show QR Intent
  if (
    lower.includes('my qr') ||
    lower.includes('माझा qr') ||
    lower.includes('माझा क्यूआर') ||
    lower.includes('मेरा क्यूआर') ||
    lower.includes('show qr') ||
    lower.includes('receive money')
  ) {
    return {
      intent: 'SHOW_QR',
      rawText: text,
      language,
      confidence: 0.95,
    };
  }

  // 7. Scan QR Intent
  if (
    lower.includes('scan') ||
    lower.includes('स्कॅन') ||
    lower.includes('स्कैन') ||
    lower.includes('camera')
  ) {
    return {
      intent: 'SCAN_QR',
      rawText: text,
      language,
      confidence: 0.92,
    };
  }

  // 8. Recharge Intent ("299 ka recharge karo")
  if (lower.includes('recharge') || lower.includes('रिचार्ज')) {
    const amount = extractAmount(text);
    return {
      intent: 'RECHARGE',
      amount: amount || undefined,
      billCategory: 'mobile',
      rawText: text,
      language,
      confidence: 0.9,
    };
  }

  // 9. Bill Payment Intent ("electricity bill भरायचं आहे")
  if (
    lower.includes('electricity') ||
    lower.includes('वीज') ||
    lower.includes('बिजली') ||
    lower.includes('light bill') ||
    lower.includes('dth') ||
    lower.includes('gas') ||
    lower.includes('गॅस') ||
    lower.includes('bill') ||
    lower.includes('बिल') ||
    lower.includes('भरायचं आहे')
  ) {
    let cat = 'electricity';
    if (lower.includes('dth')) cat = 'dth';
    if (lower.includes('gas') || lower.includes('गॅस')) cat = 'gas';
    if (lower.includes('water') || lower.includes('पाणी')) cat = 'water';
    if (lower.includes('fastag') || lower.includes('फास्टॅग')) cat = 'fastag';

    const amount = extractAmount(text);
    return {
      intent: 'PAY_BILL',
      billCategory: cat,
      amount: amount || undefined,
      rawText: text,
      language,
      confidence: 0.88,
    };
  }

  // 10. Open Section Intent
  if (lower.includes('loan') || lower.includes('कर्ज') || lower.includes('लोन')) {
    return {
      intent: 'OPEN_SECTION',
      section: 'loans',
      rawText: text,
      language,
      confidence: 0.9,
    };
  }
  if (lower.includes('sip') || lower.includes('mutual fund') || lower.includes('गुंतवणूक')) {
    return {
      intent: 'OPEN_SECTION',
      section: 'sip',
      rawText: text,
      language,
      confidence: 0.9,
    };
  }
  if (lower.includes('reward') || lower.includes('cashback') || lower.includes('बक्षीस')) {
    return {
      intent: 'OPEN_SECTION',
      section: 'rewards',
      rawText: text,
      language,
      confidence: 0.9,
    };
  }

  // 11. Request Money Intent
  if (lower.includes('request') || lower.includes('मागा') || lower.includes('मांगो') || lower.includes('मागून घ्या')) {
    const { contact, name } = matchRecipient(text, contacts);
    const amount = extractAmount(text);
    return {
      intent: 'REQUEST_MONEY',
      recipient: name,
      recipientContact: contact,
      amount: amount || undefined,
      rawText: text,
      language,
      confidence: 0.85,
    };
  }

  // 12. Send Money Intent (e.g. "send 500 rs to Aditi", "मला अदितीला पाचशे रुपये पाठवायचे आहेत",
  // "send 500 to 9876543210", "9876543210 ला पाचशे रुपये पाठवा")
  const isSendKeywords =
    lower.includes('send') ||
    lower.includes('pay') ||
    lower.includes('पाठवा') ||
    lower.includes('पाठवायचे') ||
    lower.includes('भेजो') ||
    lower.includes('भेजना') ||
    lower.includes('दे') ||
    lower.includes('द्या') ||
    lower.includes('அனுப்பு') ||
    lower.includes('చెల్లించు');

  const amount = extractAmount(text);
  const { contact, name } = matchRecipient(text, contacts);
  const phone = extractSpokenPhoneNumber(text);

  if (isSendKeywords || amount !== null || contact !== undefined || phone !== null) {
    let confidence = 0.85;
    let clarificationNeeded: string | undefined;

    if (!amount && !name && !phone) {
      confidence = 0.4;
      clarificationNeeded = 'clarifyGeneral';
    } else if (!amount) {
      clarificationNeeded = 'clarifyAmount';
    } else if (!name && !phone) {
      clarificationNeeded = 'clarifyRecipient';
    }

    return {
      intent: 'SEND_MONEY',
      recipient: name || (phone ? `Mobile ${phone}` : undefined),
      recipientContact: contact,
      amount: amount || undefined,
      phone: phone || undefined,
      rawText: text,
      language,
      confidence,
      clarificationNeeded,
    };
  }

  // Unknown intent
  return {
    intent: 'UNKNOWN',
    rawText: text,
    language,
    confidence: 0.2,
    clarificationNeeded: 'clarifyGeneral',
  };
}

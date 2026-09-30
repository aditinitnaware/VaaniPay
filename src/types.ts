/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppLanguage = 'en' | 'mr' | 'hi' | 'ta' | 'te' | 'bn';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  locale: string;
}

/**
 * BankAccount: Note that 'balance' is intentionally OMITTED here.
 * Balances are strictly sequestered inside the secure mock vault (src/data/vault.ts)
 * and can only be obtained with a single-use 10-second PIN token.
 */
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "•••• 4821"
  accountType: 'Savings' | 'Current';
  isPrimary: boolean;
  logoColor: string;
}

export interface Contact {
  id: string;
  name: string;
  nameMr?: string;
  nameHi?: string;
  upiId: string;
  phone: string;
  avatarColor: string;
  initials: string;
  isMerchant?: boolean;
  isBiller?: boolean;
  isVerified?: boolean;
  isFrequent?: boolean;
  isNew?: boolean;
}

export type TransactionType = 'sent' | 'received' | 'bill' | 'recharge';
export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  utrNumber: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string; // ISO string
  status: TransactionStatus;
  recipientUpiId?: string;
  senderUpiId?: string;
  bankAccountId: string;
  note?: string;
  category?: string;
}

export interface BillItem {
  id: string;
  billerName: string;
  billerNameMr?: string;
  billerNameHi?: string;
  category:
    | 'electricity'
    | 'mobile'
    | 'dth'
    | 'water'
    | 'gas'
    | 'broadband'
    | 'fastag'
    | 'credit_card'
    | 'loan_emi'
    | 'rent'
    | 'insurance'
    | 'education';
  consumerNumber: string;
  amount: number;
  dueDate: string;
  isOverdue: boolean;
  daysRemaining: number;
  paid: boolean;
}

export interface ScratchCard {
  id: string;
  title: string;
  rewardType: 'cashback' | 'coupon';
  amount?: number;
  couponText?: string;
  merchant?: string;
  isRevealed: boolean;
  color: string;
}

export type IntentType =
  | 'SEND_MONEY'
  | 'REQUEST_MONEY'
  | 'CHECK_BALANCE'
  | 'PAY_BILL'
  | 'RECHARGE'
  | 'TRANSACTION_HISTORY'
  | 'TRANSACTION_STATUS'
  | 'SHOW_QR'
  | 'SCAN_QR'
  | 'OPEN_SECTION'
  | 'FRAUD_ALERT'
  | 'CONFIRM_PAYMENT'
  | 'CANCEL_PAYMENT'
  | 'UNKNOWN';

export interface ParsedVoiceIntent {
  intent: IntentType;
  recipient?: string;
  recipientContact?: Contact;
  amount?: number;
  phone?: string;
  upiId?: string;
  billCategory?: string;
  operator?: string;
  section?: string;
  language: string;
  confidence: number;
  rawText: string;
  detectedFraudTerm?: string;
  clarificationNeeded?: string;
}

export type AssistantStateMachine =
  | 'IDLE'
  | 'LISTENING'
  | 'PARSED'
  | 'AWAITING_CONFIRMATION'
  | 'PIN_CHECKOUT'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED';

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  simplifiedMode: boolean;
  voiceOnlyMode: boolean;
  voiceConfirmations: boolean;
  screenReaderAuto: boolean;
  nativeNumerals: boolean; // Optional display setting (OFF by default)
  speechRate: number; // 0.75 (slow), 0.9 (normal), 1.05 (fast)
  selectedVoiceName?: string;
}

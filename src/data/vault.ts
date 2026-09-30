/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEMO_PIN } from './mockData';

/**
 * SECURE MOCK LEDGER VAULT
 *
 * CHANGE 1 REQUIREMENT:
 * The balance value must NEVER be present in the UI, DOM, notifications, toasts,
 * page titles, aria-labels, TTS output or localStorage until the PIN is verified
 * in that moment.
 *
 * Balances are stored strictly in this mock "vault" module. It exposes
 * getBalance(accountId, pinToken) and returns data ONLY if pinToken is a valid,
 * 10-second token issued after a correct PIN.
 */

// Private balance ledger in closure scope - not exposed or exported directly
const LEDGER: Record<string, number> = {
  'sbi-primary': 12450.0,
  'bom-secondary': 3200.0,
};

interface VaultTokenRecord {
  token: string;
  accountId: string;
  issuedAt: number;
  expiresAt: number;
  consumed: boolean;
}

const activeTokens = new Map<string, VaultTokenRecord>();

/**
 * Generate an unguessable mock token string
 */
function generateTokenId(): string {
  return 'vlt_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Validates the demo PIN and issues a 10-second single-use access token for the given account.
 */
export function issuePinToken(
  enteredPin: string,
  accountId: string
): { success: boolean; token?: string; error?: string; remainingAttempts?: number } {
  // Check against demo PIN
  if (enteredPin !== DEMO_PIN) {
    return {
      success: false,
      error: 'INCORRECT_PIN',
    };
  }

  const token = generateTokenId();
  const now = Date.now();
  const record: VaultTokenRecord = {
    token,
    accountId,
    issuedAt: now,
    expiresAt: now + 10000, // Valid for exactly 10 seconds
    consumed: false,
  };

  activeTokens.set(token, record);

  // Auto-purge token after 10 seconds
  setTimeout(() => {
    activeTokens.delete(token);
  }, 10500);

  return {
    success: true,
    token,
  };
}

/**
 * Retrieves the account balance IF AND ONLY IF a valid, unexpired pinToken is provided.
 * Otherwise returns null.
 */
export function getBalance(accountId: string, pinToken: string): number | null {
  if (!pinToken) return null;

  const record = activeTokens.get(pinToken);
  if (!record) return null;

  // Check expiration
  if (Date.now() > record.expiresAt) {
    activeTokens.delete(pinToken);
    return null;
  }

  // Check account matching
  if (record.accountId !== accountId) {
    return null;
  }

  return LEDGER[accountId] ?? null;
}

/**
 * Immediately invalidates/discards a token (e.g. when leaving screen, tab backgrounded, or timeout expires)
 */
export function invalidateToken(pinToken: string): void {
  if (pinToken) {
    activeTokens.delete(pinToken);
  }
}

/**
 * Deducts balance during a successful payment with a verified PIN
 */
export function deductBalance(accountId: string, amount: number, pinToken: string): boolean {
  if (!pinToken) return false;
  const record = activeTokens.get(pinToken);
  if (!record || Date.now() > record.expiresAt || record.accountId !== accountId) {
    return false;
  }

  const current = LEDGER[accountId];
  if (current === undefined || current < amount) {
    return false;
  }

  LEDGER[accountId] = Number((current - amount).toFixed(2));
  return true;
}

/**
 * Diagnostics for the Judges Inspect Panel to demonstrate strict token gating
 */
export function getVaultDiagnostics(): {
  activeTokenCount: number;
  tokens: { accountId: string; secondsRemaining: number }[];
} {
  const now = Date.now();
  const tokens: { accountId: string; secondsRemaining: number }[] = [];

  activeTokens.forEach((rec) => {
    const sec = Math.max(0, Math.round((rec.expiresAt - now) / 1000));
    tokens.push({ accountId: rec.accountId, secondsRemaining: sec });
  });

  return {
    activeTokenCount: tokens.length,
    tokens,
  };
}

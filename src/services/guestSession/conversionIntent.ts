/**
 * Conversion Intent — Stores structured intent when auth gate triggers,
 * so post-registration can redirect the user to exactly where they wanted to go.
 */

import type { AuthGateReason } from '@/hooks/useAuthGate';

export interface ConversionIntent {
  attempted_action: AuthGateReason;
  attempted_target_type?: string;
  attempted_target_id?: string;
  post_auth_redirect: string;
  created_at: string;
}

const STORAGE_KEY = 'diviso_conversion_intent';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export function setConversionIntent(intent: Omit<ConversionIntent, 'created_at'>): void {
  const full: ConversionIntent = {
    ...intent,
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch (e) {
    console.error('[ConversionIntent] Failed to save:', e);
  }
}

export function getConversionIntent(): ConversionIntent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const intent: ConversionIntent = JSON.parse(raw);

    // Expire old intents
    const age = Date.now() - new Date(intent.created_at).getTime();
    if (age > MAX_AGE_MS) {
      clearConversionIntent();
      return null;
    }

    return intent;
  } catch {
    clearConversionIntent();
    return null;
  }
}

export function clearConversionIntent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('diviso_auth_redirect');
  } catch {}
}

/**
 * Conversion Analytics Events — Tracks the guest-to-registered funnel.
 * Uses the existing trackAnalyticsEvent infrastructure.
 */

import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';
import type { AuthGateReason } from '@/hooks/useAuthGate';

export async function trackGateTriggered(reason: AuthGateReason, targetId?: string): Promise<void> {
  await trackAnalyticsEvent('guest_gate_triggered', {
    reason,
    target_id: targetId || null,
  });
}

export async function trackRegistrationStarted(reason: AuthGateReason): Promise<void> {
  await trackAnalyticsEvent('guest_registration_started', { reason });
}

export async function trackRegistrationCompleted(reason: AuthGateReason | null, hadGuestData: boolean): Promise<void> {
  await trackAnalyticsEvent('guest_registration_completed', {
    reason: reason || 'direct',
    had_guest_data: hadGuestData,
  });
}

export async function trackMigrationCompleted(result: {
  groupsMigrated: number;
  expensesMigrated: number;
  plansMigrated: number;
  status: string;
}): Promise<void> {
  await trackAnalyticsEvent('guest_conversion_migration_completed', result);
}

export async function trackMigrationFailed(error: string): Promise<void> {
  await trackAnalyticsEvent('guest_conversion_migration_failed', { error });
}

export async function trackPostAuthRedirect(target: string, success: boolean): Promise<void> {
  await trackAnalyticsEvent('guest_post_auth_redirect', { target, success });
}

export async function trackInviteConversion(groupId: string): Promise<void> {
  await trackAnalyticsEvent('invite_conversion_completed', { group_id: groupId });
}

import { useState, useCallback } from 'react';
import { setConversionIntent } from '@/services/guestSession/conversionIntent';
import { trackGateTriggered } from '@/services/guestSession/conversionEvents';

export type AuthGateReason =
  | 'add_members'
  | 'invite_members'
  | 'share_group'
  | 'join_group'
  | 'accept_invite'
  | 'permanent_sync'
  | 'collaborative_action'
  | 'general';

export function useAuthGate() {
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState<AuthGateReason>('general');
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  const requireAuth = useCallback((
    reason: AuthGateReason,
    redirectTo?: string,
    targetId?: string,
  ) => {
    const redirect = redirectTo || '/dashboard';

    setGateReason(reason);
    setGateOpen(true);
    setRedirectAfterAuth(redirect);

    // Persist structured intent for post-auth continuation
    setConversionIntent({
      attempted_action: reason,
      attempted_target_id: targetId,
      post_auth_redirect: redirect,
    });

    // Track analytics
    trackGateTriggered(reason, targetId).catch(() => {});
  }, []);

  const dismissGate = useCallback(() => {
    setGateOpen(false);
    setGateReason('general');
    setRedirectAfterAuth(null);
  }, []);

  return { gateOpen, gateReason, redirectAfterAuth, requireAuth, dismissGate };
}

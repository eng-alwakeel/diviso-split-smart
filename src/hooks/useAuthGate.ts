import { useState, useCallback } from 'react';

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

  const requireAuth = useCallback((reason: AuthGateReason, redirectTo?: string) => {
    setGateReason(reason);
    setGateOpen(true);
    if (redirectTo) {
      setRedirectAfterAuth(redirectTo);
      localStorage.setItem('diviso_auth_redirect', redirectTo);
    }
  }, []);

  const dismissGate = useCallback(() => {
    setGateOpen(false);
    setGateReason('general');
    setRedirectAfterAuth(null);
  }, []);

  return { gateOpen, gateReason, redirectAfterAuth, requireAuth, dismissGate };
}

/**
 * Guest Session Manager — localStorage-based session lifecycle
 * No Supabase, no auth — purely client-side identity for temporary usage.
 */

const SESSION_KEY = 'diviso_guest_session';
const SESSION_EXPIRY_DAYS = 7;

export interface GuestSession {
  guest_session_id: string;
  created_at: string;
  last_active_at: string;
  expires_at: string;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: GuestSession = JSON.parse(raw);
    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      clearGuestSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getOrCreateGuestSession(): GuestSession {
  const existing = getGuestSession();
  if (existing) {
    touchGuestSession();
    return existing;
  }
  const now = new Date();
  const session: GuestSession = {
    guest_session_id: generateId(),
    created_at: now.toISOString(),
    last_active_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function touchGuestSession(): void {
  const session = getGuestSession();
  if (session) {
    session.last_active_at = new Date().toISOString();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearGuestSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isGuestSession(): boolean {
  return getGuestSession() !== null;
}

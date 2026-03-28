/**
 * Home Mode Engine — Constants & Configuration
 * 
 * ## Modes (priority order):
 * 1. creator_active_mode  — User owns at least one group
 * 2. participant_mode     — User joined groups but never created one
 * 3. share_ready_mode     — User has draft groups with expenses, ready to collaborate
 * 4. re_engagement_mode   — User has prior data but has been inactive
 * 5. in_progress_mode     — User has drafts/plans in progress
 * 6. first_entry_mode     — No meaningful prior usage
 * 
 * ## Overlays:
 * - invite_priority       — Active when user has pending invites or entered via invite link
 * - auth_required_gate    — Reserved for future guest mode (never activated for registered users)
 */

export const HOME_MODES = {
  CREATOR_ACTIVE: 'creator_active_mode',
  PARTICIPANT: 'participant_mode',
  SHARE_READY: 'share_ready_mode',
  RE_ENGAGEMENT: 're_engagement_mode',
  IN_PROGRESS: 'in_progress_mode',
  FIRST_ENTRY: 'first_entry_mode',
} as const;

export const OVERLAYS = {
  INVITE_PRIORITY: 'invite_priority',
  AUTH_REQUIRED_GATE: 'auth_required_gate',
} as const;

export const THRESHOLDS = {
  STALE_DAYS: 14,
} as const;

export const MODE_PRIORITY = [
  HOME_MODES.CREATOR_ACTIVE,
  HOME_MODES.PARTICIPANT,
  HOME_MODES.SHARE_READY,
  HOME_MODES.RE_ENGAGEMENT,
  HOME_MODES.IN_PROGRESS,
  HOME_MODES.FIRST_ENTRY,
] as const;

export type HomeMode = typeof HOME_MODES[keyof typeof HOME_MODES];
export type Overlay = typeof OVERLAYS[keyof typeof OVERLAYS];

import { HOME_MODES, OVERLAYS, THRESHOLDS } from './constants';
import type { UserDataProfile, HomeModeResult } from './types';

/**
 * Pure deterministic resolver — no side effects, no DB calls.
 * Takes a data profile, returns mode + overlays + reason.
 */
export function resolveHomeMode(profile: UserDataProfile): HomeModeResult {
  let current_home_mode: string;
  let resolution_reason: string;

  // Priority 1: Creator
  if (profile.owned_groups_count > 0) {
    current_home_mode = HOME_MODES.CREATOR_ACTIVE;
    resolution_reason = `User owns ${profile.owned_groups_count} group(s) → creator_active_mode`;
  }
  // Priority 2: Participant
  else if (profile.joined_groups_count > 0) {
    current_home_mode = HOME_MODES.PARTICIPANT;
    resolution_reason = `User joined ${profile.joined_groups_count} group(s) but owns none → participant_mode`;
  }
  // Priority 3: Share-ready
  else if (profile.draft_groups_with_expenses_count > 0) {
    current_home_mode = HOME_MODES.SHARE_READY;
    resolution_reason = `User has ${profile.draft_groups_with_expenses_count} draft group(s) with expenses → share_ready_mode`;
  }
  // Priority 4: Re-engagement
  else if (profile.stale_days >= THRESHOLDS.STALE_DAYS && profile.has_in_progress_data) {
    current_home_mode = HOME_MODES.RE_ENGAGEMENT;
    resolution_reason = `User inactive for ${profile.stale_days} days with prior data → re_engagement_mode`;
  }
  // Priority 5: In-progress
  else if (profile.has_in_progress_data) {
    current_home_mode = HOME_MODES.IN_PROGRESS;
    resolution_reason = `User has drafts/plans in progress → in_progress_mode`;
  }
  // Priority 6: First entry (default)
  else {
    current_home_mode = HOME_MODES.FIRST_ENTRY;
    resolution_reason = `No meaningful prior usage → first_entry_mode`;
  }

  // Overlays
  const active_overlays: string[] = [];

  if (profile.entered_via_invite_link || profile.pending_invites_count > 0) {
    active_overlays.push(OVERLAYS.INVITE_PRIORITY);
    const inviteDetail = profile.entered_via_invite_link
      ? 'entered via invite link'
      : `${profile.pending_invites_count} pending invite(s)`;
    resolution_reason += `. ${inviteDetail} → invite_priority overlay activated`;
  }

  // auth_required_gate: reserved, never activated for registered users

  return {
    current_home_mode,
    active_overlays,
    resolution_reason,
    data_profile_snapshot: { ...profile },
  };
}

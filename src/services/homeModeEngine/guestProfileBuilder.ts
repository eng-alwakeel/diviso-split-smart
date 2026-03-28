/**
 * Guest Profile Builder — Constructs UserDataProfile from localStorage guest data.
 */

import { getGuestSession } from '@/services/guestSession/guestSessionManager';
import { getGuestGroups, getGuestExpenses, getGuestPlans } from '@/services/guestSession/guestDataStore';
import type { UserDataProfile } from './types';

export function buildGuestDataProfile(): UserDataProfile {
  const session = getGuestSession();
  const groups = getGuestGroups();
  const expenses = getGuestExpenses();
  const plans = getGuestPlans();

  const groupsWithExpenses = groups.filter(g =>
    expenses.some(e => e.group_id === g.id)
  );

  const lastActivityAt = session?.last_active_at ?? null;
  let staleDays = 0;
  if (lastActivityAt) {
    staleDays = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  const hasInProgressData = groups.length > 0 || plans.length > 0 || expenses.length > 0;

  // Check for invite token in localStorage
  const joinToken = localStorage.getItem('joinToken');
  const enteredViaInvite = !!joinToken;

  return {
    // Identity
    identity_type: 'guest',
    guest_session_id: session?.guest_session_id ?? null,
    guest_temporary_groups_count: groups.length,
    guest_temporary_expenses_count: expenses.length,
    guest_draft_plans_count: plans.length,

    // Registered-only fields — zeroed out
    owned_groups_count: 0,
    owned_active_groups_count: 0,
    owned_archived_groups_count: 0,
    joined_groups_count: 0,
    joined_active_groups_count: 0,
    joined_archived_groups_count: 0,
    draft_groups_count: groups.length,
    draft_groups_with_expenses_count: groupsWithExpenses.length,
    draft_plans_count: plans.length,
    has_in_progress_data: hasInProgressData,
    expenses_count: expenses.length,
    has_balance: false,
    has_settlement_action: false,
    activity_count: expenses.length,
    last_activity_at: lastActivityAt,
    stale_days: staleDays,
    pending_invites_count: 0,
    entered_via_invite_link: enteredViaInvite,
    invite_target_group_id: joinToken ?? null,
    has_creator_experience: false,
    has_participant_experience: false,
  };
}

import { supabase } from '@/integrations/supabase/client';
import type { UserDataProfile } from './types';

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export async function buildUserDataProfile(userId: string): Promise<UserDataProfile> {
  // All queries in parallel
  const [
    groupsResult,
    expensesResult,
    plansResult,
    settlementsResult,
    balanceResult,
    activityResult,
    invitesResult,
  ] = await Promise.all([
    // 1. Groups with ownership & archive info
    supabase
      .from('group_members')
      .select('group_id, groups!inner(owner_id, archived_at, status)')
      .eq('user_id', userId)
      .limit(500),

    // 2. Expenses count
    supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId),

    // 3. Draft plans
    supabase
      .from('plans')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', userId)
      .eq('status', 'draft'),

    // 4. Pending settlements
    supabase
      .from('settlements')
      .select('id', { count: 'exact', head: true })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .in('status', ['pending']),

    // 5. Balance check (any expense splits)
    supabase
      .from('expense_splits')
      .select('share_amount', { count: 'exact', head: true })
      .eq('member_id', userId),

    // 6. Activity log
    supabase
      .from('user_action_log')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1),

    // 7. Pending invites
    supabase
      .from('group_invites')
      .select('id', { count: 'exact', head: true })
      .eq('invited_user_id', userId)
      .eq('status', 'pending'),
  ]);

  // Parse groups
  const groups = (groupsResult.data ?? []) as any[];
  
  const ownedGroups = groups.filter(g => g.groups?.owner_id === userId);
  const joinedGroups = groups.filter(g => g.groups?.owner_id !== userId);

  const owned_active = ownedGroups.filter(g => !g.groups?.archived_at).length;
  const owned_archived = ownedGroups.filter(g => !!g.groups?.archived_at).length;
  const joined_active = joinedGroups.filter(g => !g.groups?.archived_at).length;
  const joined_archived = joinedGroups.filter(g => !!g.groups?.archived_at).length;

  // Draft groups (status = 'draft' and owned)
  const draftGroups = ownedGroups.filter(g => g.groups?.status === 'draft');
  const draft_groups_count = draftGroups.length;

  // Check draft groups with expenses
  let draft_groups_with_expenses_count = 0;
  if (draftGroups.length > 0) {
    const draftGroupIds = draftGroups.map(g => g.group_id);
    const { count } = await supabase
      .from('expenses')
      .select('group_id', { count: 'exact', head: true })
      .in('group_id', draftGroupIds);
    draft_groups_with_expenses_count = count && count > 0 ? 1 : 0; // at least one draft has expenses
  }

  const expenses_count = expensesResult.count ?? 0;
  const draft_plans_count = plansResult.count ?? 0;
  const has_settlement_action = (settlementsResult.count ?? 0) > 0;
  const has_balance = (balanceResult.count ?? 0) > 0;
  const pending_invites_count = invitesResult.count ?? 0;

  // Activity
  const lastActivity = activityResult.data?.[0]?.created_at ?? null;
  const activity_count = activityResult.data?.length ?? 0; // approximate from limit=1
  const stale_days = daysSince(lastActivity);

  // Invite link context
  const joinToken = typeof window !== 'undefined' ? localStorage.getItem('joinToken') : null;
  const phoneInviteToken = typeof window !== 'undefined' ? localStorage.getItem('phoneInviteToken') : null;
  const entered_via_invite_link = !!(joinToken || phoneInviteToken);
  const invite_target_group_id: string | null = null; // can be extended later

  // Derived
  const owned_groups_count = ownedGroups.length;
  const joined_groups_count = joinedGroups.length;
  const has_in_progress_data = draft_groups_count > 0 || draft_plans_count > 0 || expenses_count > 0;

  return {
    identity_type: 'registered' as const,
    guest_session_id: null,
    guest_temporary_groups_count: 0,
    guest_temporary_expenses_count: 0,
    guest_draft_plans_count: 0,
    owned_groups_count,
    owned_active_groups_count: owned_active,
    owned_archived_groups_count: owned_archived,
    joined_groups_count,
    joined_active_groups_count: joined_active,
    joined_archived_groups_count: joined_archived,
    draft_groups_count,
    draft_groups_with_expenses_count,
    draft_plans_count,
    has_in_progress_data,
    expenses_count,
    has_balance,
    has_settlement_action,
    activity_count,
    last_activity_at: lastActivity,
    stale_days,
    pending_invites_count,
    entered_via_invite_link,
    invite_target_group_id,
    has_creator_experience: owned_groups_count > 0,
    has_participant_experience: joined_groups_count > 0,
  };
}

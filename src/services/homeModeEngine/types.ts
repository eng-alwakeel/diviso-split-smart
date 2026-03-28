export interface UserDataProfile {
  // Ownership & participation
  owned_groups_count: number;
  owned_active_groups_count: number;
  owned_archived_groups_count: number;
  joined_groups_count: number;
  joined_active_groups_count: number;
  joined_archived_groups_count: number;
  // Draft & progress
  draft_groups_count: number;
  draft_groups_with_expenses_count: number;
  draft_plans_count: number;
  has_in_progress_data: boolean;
  // Financial & usage
  expenses_count: number;
  has_balance: boolean;
  has_settlement_action: boolean;
  activity_count: number;
  last_activity_at: string | null;
  stale_days: number;
  // Invite context
  pending_invites_count: number;
  entered_via_invite_link: boolean;
  invite_target_group_id: string | null;
  // Experience flags (derived)
  has_creator_experience: boolean;
  has_participant_experience: boolean;
}

export interface HomeModeResult {
  current_home_mode: string;
  active_overlays: string[];
  resolution_reason: string;
  data_profile_snapshot: UserDataProfile;
}

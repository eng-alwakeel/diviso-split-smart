

# Phase 1: Core Home Mode Engine

## Overview
Build a standalone resolver module that determines the correct home page mode for a registered user. No UI changes, no guest mode — pure logic layer.

## Architecture

```text
src/services/homeModeEngine/
  ├── constants.ts        ← Mode & overlay names, thresholds
  ├── types.ts            ← UserDataProfile, HomeModeResult interfaces
  ├── dataProfileBuilder.ts  ← Fetches data from Supabase, builds profile
  ├── modeResolver.ts     ← Pure function: profile → mode + overlays + reason
  ├── index.ts            ← Re-exports
  └── __tests__/
      └── modeResolver.test.ts  ← Inline test scenarios (not run, for docs)

src/hooks/useHomeMode.ts  ← React hook wrapping the engine
```

## File Details

### 1. `constants.ts` — Mode & Overlay Config

```ts
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
  AUTH_REQUIRED_GATE: 'auth_required_gate', // reserved for guest mode
} as const;

export const THRESHOLDS = {
  STALE_DAYS: 14, // days without activity for re-engagement
} as const;

// Priority order (index = priority, lower = higher)
export const MODE_PRIORITY = [
  HOME_MODES.CREATOR_ACTIVE,
  HOME_MODES.PARTICIPANT,
  HOME_MODES.SHARE_READY,
  HOME_MODES.RE_ENGAGEMENT,
  HOME_MODES.IN_PROGRESS,
  HOME_MODES.FIRST_ENTRY,
] as const;
```

### 2. `types.ts` — Data Profile & Result

```ts
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
```

### 3. `dataProfileBuilder.ts` — Supabase Queries

Fetches all required data in parallel using `Promise.all`:

**Query 1 — Groups**: `group_members` joined with `groups` to get `owner_id`, `archived_at`, `status`. Split into:
- Owned groups: `groups.owner_id === userId`
- Joined groups: `groups.owner_id !== userId`
- Active/archived by `archived_at`
- Draft: `groups.status === 'draft'` (if exists, fallback to 0)

**Query 2 — Expenses**: `expenses` count where `created_by = userId`

**Query 3 — Draft groups with expenses**: For draft group IDs, check if any have expenses

**Query 4 — Plans**: `plans` where `owner_user_id = userId` and `status = 'draft'`

**Query 5 — Settlements**: Check `settlements` for pending actions (`from_user_id` or `to_user_id`)

**Query 6 — Balance**: Quick check via `expense_splits` if user has non-zero shares

**Query 7 — Activity**: `user_action_log` count + last `created_at`

**Query 8 — Pending invites**: `group_invites` where `invited_user_id = userId` and `status = 'pending'`

**Invite link context**: Read `localStorage.getItem('joinToken')` and `localStorage.getItem('phoneInviteToken')`

**Derived fields**:
- `stale_days` = days since `last_activity_at` (or 999 if null)
- `has_creator_experience` = `owned_groups_count > 0`
- `has_participant_experience` = `joined_groups_count > 0`
- `has_in_progress_data` = `draft_groups_count > 0 || draft_plans_count > 0 || expenses_count > 0`

### 4. `modeResolver.ts` — Pure Deterministic Resolver

A **pure function** (no side effects, no DB calls):

```ts
export function resolveHomeMode(profile: UserDataProfile): HomeModeResult
```

**Mode selection** (first match wins, follows priority order):

1. **creator_active_mode**: `owned_groups_count > 0`
   - Reason: "User owns {n} groups → creator_active_mode"

2. **participant_mode**: `joined_groups_count > 0`
   - Reason: "User joined {n} groups but owns none → participant_mode"

3. **share_ready_mode**: `draft_groups_with_expenses_count > 0`
   - Reason: "User has {n} draft groups with expenses → share_ready_mode"

4. **re_engagement_mode**: `stale_days >= THRESHOLDS.STALE_DAYS && has_in_progress_data`
   - Reason: "User inactive for {n} days with prior data → re_engagement_mode"

5. **in_progress_mode**: `has_in_progress_data`
   - Reason: "User has drafts/plans in progress → in_progress_mode"

6. **first_entry_mode**: default fallback
   - Reason: "No meaningful prior usage → first_entry_mode"

**Overlay logic**:
- `invite_priority`: `entered_via_invite_link || pending_invites_count > 0`
- `auth_required_gate`: never activated (reserved, always excluded)

### 5. `useHomeMode.ts` — React Hook

```ts
export function useHomeMode(): {
  result: HomeModeResult | null;
  isLoading: boolean;
  refresh: () => void;
}
```

Uses `useQuery` to call `buildUserDataProfile(userId)`, then `useMemo` to run `resolveHomeMode(profile)`. Logs `resolution_reason` in dev mode.

### 6. Test Scenarios (inline documentation)

```ts
// Scenario 1: First entry — all zeros → first_entry_mode
// Scenario 2: Created 1 group → creator_active_mode
// Scenario 3: Joined 2 groups, owns 0 → participant_mode
// Scenario 4: Draft group with expenses → share_ready_mode
// Scenario 5: Draft group, no expenses → in_progress_mode
// Scenario 6: Had activity 30 days ago, has drafts → re_engagement_mode
// Scenario 7: Creator + pending invite → creator_active_mode + invite_priority
// Scenario 8: joinToken in localStorage → adds invite_priority overlay
```

## Files to Create/Edit
| File | Action |
|---|---|
| `src/services/homeModeEngine/constants.ts` | Create |
| `src/services/homeModeEngine/types.ts` | Create |
| `src/services/homeModeEngine/dataProfileBuilder.ts` | Create |
| `src/services/homeModeEngine/modeResolver.ts` | Create |
| `src/services/homeModeEngine/index.ts` | Create |
| `src/hooks/useHomeMode.ts` | Create |

No existing files modified. No DB migrations needed. No UI changes.


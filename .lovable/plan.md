# Rebuild New User Onboarding Flow

## Overview

Create a multi-step, fullscreen onboarding experience for users with zero groups. When a new user lands on `/dashboard` with no groups, they are redirected to `/onboarding` -- a dedicated flow that guides them through group creation, a demo expense "aha moment", and friend invitation before unlocking the full dashboard.

## Architecture

### New Files


| File                                                | Purpose                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/pages/Onboarding.tsx`                          | Main onboarding page with step state machine (steps 1-4 + waiting screen)                |
| `src/hooks/useOnboardingV2.ts`                      | Hook managing step state, feature flag check, group creation, demo expense, invite logic |
| `src/hooks/useFeatureFlag.ts`                       | Generic hook to read `admin_feature_flags` table by flag name                            |
| `src/components/onboarding-v2/StepStart.tsx`        | Screen 1 -- welcome + single CTA                                                         |
| `src/components/onboarding-v2/StepQuickGroup.tsx`   | Screen 2 -- group name (pre-filled) + member count selector                              |
| `src/components/onboarding-v2/StepDemoExpense.tsx`  | Screen 3 -- auto-generated expense with split breakdown                                  |
| `src/components/onboarding-v2/StepInvite.tsx`       | Screen 4 -- share/copy invite link                                                       |
| `src/components/onboarding-v2/WaitingScreen.tsx`    | Lock screen -- waiting for second member                                                 |
| `src/components/onboarding-v2/OnboardingLayout.tsx` | Shared fullscreen layout wrapper (no header, no bottom nav)                              |


### Modified Files


| File                              | Change                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/pages/Dashboard.tsx`         | Add redirect: if `new_onboarding_v2` flag is on and `groupsCount === 0`, navigate to `/onboarding` |
| `src/App.tsx`                     | Add route: `/onboarding` -> `ProtectedRoute` -> `LazyOnboarding`                                   |
| `src/hooks/useAnalyticsEvents.ts` | Add new event names to `EVENT_CATEGORIES`                                                          |


## Step-by-Step Flow

### Step 1 -- Start

- Fullscreen, centered layout
- Title: `خلنا نبدأ بأول مجموعة 👇`
- Subtitle: `Diviso يشتغل لما تضيف أشخاص وتقسم مصروف.\nخلنا نوريك خلال 30 ثانية.`
- Single button: `➕ إنشاء مجموعة`
- Track: `onboarding_started`

### Step 2 -- Quick Group Creation

- Group name input, pre-filled with `طلعة نهاية الأسبوع`
- Member count selector: buttons for 2, 3, 4, 5+ (button-group style, default=3)
- Currency auto-detected from profile or default SAR
- Button: `التالي`
- On submit: create group in Supabase (same logic as `CreateGroup.tsx` but simplified, no credit check during onboarding)
- Track: `group_created`

### Step 3 -- Demo Expense (Aha Moment)

- Auto-create an expense in the new group: `مطعم` -- 200 SAR, paid by current user, split equally among selected member count
- Display a clean card showing:
  - `🧾 مطعم -- 200 ريال`
  - `👤 Paid by: You`
  - `👥 Split among N people`
  - Visual breakdown: `💰 لك: X ريال` / `💸 عليك: 0 ريال`
- The expense is inserted into the `expenses` table as a real record
- Auto-advance after 2 seconds or user taps `التالي`
- Track: `demo_expense_generated`

### Step 4 -- Invite Friends

- Title: `عشان يعرفون كم عليهم… لازم ينضمون 😅`
- Generate invite link (reuse `useGroupInvites` hook)
- Pre-filled share message: `"دفعت عنكم 200 ريال 😅\nشوفوا كم عليكم في Diviso 👇\n[Group Link]"`
- Two actions: `📲 دعوة الأصدقاء` (native share) + `نسخ الرابط` (copy)
- After share or copy, enable `التالي` button
- Track: `invite_shared`

### Waiting Screen (Lock)

- After step 4, check if group has >= 2 members
- If not: show waiting screen with title `بانتظار انضمام شخص واحد عشان تبدأ القسمة الفعلية 👇`
- Show re-share button
- Set up a realtime subscription on `group_members` table for the created group
- When a second member joins: track `second_member_joined` + `onboarding_completed`, then navigate to `/dashboard`

### Dashboard Gate

In `Dashboard.tsx`, early in the component (after userId and groupsCount are available):

```
if (featureFlag('new_onboarding_v2') && groupsCount === 0) {
  navigate('/onboarding', { replace: true });
  return null;
}
```

This ensures users who somehow navigate to dashboard are redirected back.

## Feature Flag (A/B)

- Use existing `admin_feature_flags` table
- Insert row: `flag_name = 'new_onboarding_v2'`, `flag_value = { "enabled": true }`
- `useFeatureFlag('new_onboarding_v2')` returns boolean
- When flag is off, dashboard behaves exactly as today (existing onboarding checklist)

## Analytics Events

Add to `EVENT_CATEGORIES` in `useAnalyticsEvents.ts`:

```
onboarding_started: 'engagement',
demo_expense_generated: 'engagement',
invite_shared: 'growth',
second_member_joined: 'growth',
onboarding_completed: 'engagement',
```

(`group_created` and `invite_sent` already exist)

## UX Details

- Fullscreen layout, `min-h-screen`, centered content, no `AppHeader`, no `BottomNav`
- Large buttons (`size="lg"`, `w-full`, `text-lg`)
- Step transitions: simple fade/slide using CSS transitions
- Progress indicator: subtle dots or step counter at top (e.g., `1/4`)
- All text in Arabic by default, with i18n keys for English
- RTL-aware layout using existing `useLanguage` hook

## Technical Details

- **Group creation** reuses existing Supabase insert logic from `CreateGroup.tsx` but skips credit check (onboarding is free)
- **Demo expense** inserts a real expense via `expenses` table with `is_demo: true` metadata (or a note field) so it can optionally be cleaned up
- **Invite link** reuses `useGroupInvites` hook which already generates and manages invite codes
- **Realtime listener** for waiting screen uses existing `supabase.channel()` pattern on `group_members` table filtered by `group_id`
- **State persistence**: store current onboarding step + created group ID in `localStorage` so refreshing doesn't restart the flow
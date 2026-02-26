

# Fix: New Users Skipping Onboarding When Added to Someone Else's Group

## Root Cause Analysis

### Issue 1: Dashboard Instead of Onboarding
The current redirect logic in `Dashboard.tsx` (line 292):
```
if (!loading && !dashboardMode.isLoading && onboardingV2Enabled && groupsCount === 0) {
  navigate('/onboarding', { replace: true });
}
```
Only checks `groupsCount === 0`. User #75 was **added as a member** to another user's group, so `groupsCount = 1`, bypassing onboarding entirely -- even though they completed **0 out of 5** onboarding tasks.

### Issue 2: "150 Credits" -- Actually Correct
- 100 credits: Founding welcome (Feb 3)
- 50 credits: Monthly founding credits (auto-granted by cron on Feb 17)
- Total = 150. This is working as designed.

## Proposed Fix

### Change 1: Smarter Onboarding Redirect Logic
**File: `src/pages/Dashboard.tsx`** (line 290-295)

Update the redirect condition to also check onboarding completion status from `dashboardMode`:

```typescript
// Before:
if (!loading && !dashboardMode.isLoading && onboardingV2Enabled && groupsCount === 0) {
  navigate('/onboarding', { replace: true });
}

// After:
if (
  !loading &&
  !dashboardMode.isLoading &&
  onboardingV2Enabled &&
  (groupsCount === 0 || (
    dashboardMode.completedCount === 0 &&
    !dashboardMode.rewardClaimed &&
    dashboardMode.isWithinOnboardingWindow
  ))
) {
  navigate('/onboarding', { replace: true });
}
```

This ensures users who were added to groups by others (but never completed onboarding themselves) still get the onboarding flow -- but only within the 7-day window.

### Change 2: Handle "member-only" users in Onboarding
**File: `src/pages/Onboarding.tsx`** (around lines 60-67)

The current logic redirects users away from onboarding if they already have groups. Update it to only redirect if the user **owns** a group (not just a member):

```typescript
// Before: checks if user has ANY groups
const { data: groups } = await supabase
  .from('group_members')
  .select('group_id')
  .eq('user_id', session.user.id);

if (groups && groups.length > 0) {
  navigate('/dashboard', { replace: true });
}

// After: only skip if user OWNS a group
const { data: ownedGroups } = await supabase
  .from('group_members')
  .select('group_id')
  .eq('user_id', session.user.id)
  .eq('role', 'owner');

if (ownedGroups && ownedGroups.length > 0) {
  navigate('/dashboard', { replace: true });
}
```

### No Credit Changes Needed
The 150 credits (100 welcome + 50 monthly) are correct behavior for a founding user active for more than one month.

## Summary
- 2 file changes (`Dashboard.tsx`, `Onboarding.tsx`)
- No database changes needed
- No translation changes needed
- Fixes: dormant users who were invited to groups now properly see onboarding
- Credits (150) are correct and need no fix

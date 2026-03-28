

# Phase 5: Guest-to-Registered Conversion Optimization

## Current State
- `useAuthGate` stores reason + redirect in localStorage but **never reads it back** after auth
- `AuthRequiredGate` navigates to `/auth` but doesn't pass the reason or redirect context
- `migrateGuestData()` exists but is **never called** anywhere — Auth.tsx doesn't trigger it
- Auth.tsx handles `joinToken` and `phoneInviteToken` post-auth redirects but has no guest migration logic
- No conversion event tracking exists

## Plan

### 1. Conversion Intent Model (`src/services/guestSession/conversionIntent.ts`) — Create

Store structured intent in localStorage when auth gate triggers:
```ts
interface ConversionIntent {
  attempted_action: AuthGateReason;
  attempted_target_id?: string;
  post_auth_redirect: string;
  created_at: string;
}
```
Functions: `setConversionIntent()`, `getConversionIntent()`, `clearConversionIntent()`

### 2. Update `useAuthGate.ts` — Edit

When `requireAuth()` is called, also save a `ConversionIntent` via the new module. This replaces the ad-hoc `diviso_auth_redirect` localStorage usage with structured intent.

### 3. Update `AuthRequiredGate.tsx` — Edit

- Pass `redirectAfterAuth` to `/auth` as a query param
- Show invite-specific UI when reason is `join_group` or `accept_invite` (group name, inviter if available)
- Add value proposition bullets (preserve progress, free account)

### 4. Update `Auth.tsx` — Edit (Critical)

After successful auth (`SIGNED_IN` event for new signups):
1. Check `hasGuestDataToMigrate()` → call `migrateGuestData(userId)`
2. Check `getConversionIntent()` → redirect to `post_auth_redirect` instead of generic `/dashboard`
3. Clear intent after redirect
4. Track conversion events

Order: migration first → then redirect (so data is available at the target page).

### 5. Conversion Analytics Events (`src/services/guestSession/conversionEvents.ts`) — Create

Lightweight event emitter using existing `trackAnalyticsEvent`:
- `guest_gate_triggered` (reason, target)
- `guest_registration_started` (reason)
- `guest_registration_completed` (reason, had_guest_data)
- `guest_migration_completed` (groups, expenses, plans migrated)
- `guest_migration_failed` (error)
- `guest_post_auth_redirect` (target, success)
- `invite_conversion_completed` (group_id)

### 6. Improve `guestConversion.ts` — Edit

- Return structured result with `status: 'success' | 'partial' | 'failed'` and error details
- Add try/catch around the full flow with partial success tracking
- Don't clear guest data if migration completely failed (recovery path)

### 7. Admin Simulator Extension (`ModeSimulator.tsx`) — Edit

Add preset scenarios:
- "Guest tries add members" → shows gate trigger + redirect target
- "Guest from invite link → registers" → shows full flow

Add output section showing: conversion intent, expected post-auth redirect.

### 8. Translation Keys — Edit `ar/dashboard.json` + `en/dashboard.json`

Add gate-specific titles, subtitles, value props:
```json
"conversion": {
  "gate_subtitle_add_members": "سجّل حسابك لإضافة أعضاء...",
  "gate_value_free": "التسجيل مجاني",
  "gate_value_preserve": "بياناتك محفوظة",
  "gate_value_instant": "استمرار فوري",
  "migration_success": "تم نقل بياناتك بنجاح",
  "migration_partial": "تم نقل بعض البيانات"
}
```

## Files Summary

| File | Action |
|---|---|
| `src/services/guestSession/conversionIntent.ts` | Create — structured intent storage |
| `src/services/guestSession/conversionEvents.ts` | Create — analytics event helpers |
| `src/services/guestSession/guestConversion.ts` | Edit — structured result, partial handling |
| `src/hooks/useAuthGate.ts` | Edit — save ConversionIntent |
| `src/components/dashboard/AuthRequiredGate.tsx` | Edit — richer gate UI, pass redirect |
| `src/pages/Auth.tsx` | Edit — call migrateGuestData + read intent + redirect |
| `src/components/admin/homemode/ModeSimulator.tsx` | Edit — conversion presets |
| `src/i18n/locales/ar/dashboard.json` | Edit — conversion keys |
| `src/i18n/locales/en/dashboard.json` | Edit — conversion keys |

## Key Decisions
1. **Migration before redirect** — guest data must exist in Supabase before the user lands on the target page
2. **Don't clear data on failure** — if migration fails, keep localStorage so user can retry
3. **Intent is ephemeral** — cleared after first successful use; prevents stale redirects
4. **No new DB tables** — events go through existing `analytics_events` table via `trackAnalyticsEvent`


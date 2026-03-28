

# Phase 4: Guest System on Home Mode Engine

## Scope Summary
Extend the existing Home Mode Engine to support guest identity — localStorage-based sessions, guest-aware mode resolution, auth gates on collaborative actions, and invite-link interception. No redesign, no new pages — same shell, extended logic.

## Architecture

```text
src/services/guestSession/
  ├── guestSessionManager.ts   ← Create/restore/expire guest sessions (localStorage)
  ├── guestDataStore.ts        ← CRUD for temporary groups/expenses/plans (localStorage)
  └── guestConversion.ts       ← Migrate guest data → registered user (Supabase)

src/services/homeModeEngine/
  ├── types.ts                 ← Extended: identity_type + guest fields
  ├── guestProfileBuilder.ts   ← NEW: builds UserDataProfile from localStorage
  ├── modeResolver.ts          ← Extended: guest-aware resolution rules
  ├── uiModeConfig.ts          ← Extended: guest UI configs
  ├── modeRulesConfig.ts       ← Extended: guest rule docs
  └── constants.ts             ← No change (reuses same modes)

src/hooks/
  ├── useHomeMode.ts           ← Extended: detect guest vs registered
  ├── useGuestSession.ts       ← NEW: React hook for guest state
  └── useAuthGate.ts           ← NEW: trigger auth_required_gate overlay

src/components/
  ├── GuestRoute.tsx            ← NEW: like ProtectedRoute but allows guests
  ├── dashboard/
  │   └── AuthRequiredGate.tsx  ← NEW: contextual registration prompt
  └── admin/homemode/
      └── ModeSimulator.tsx     ← Extended: identity_type toggle
```

## Detailed Changes

### 1. Guest Session Manager (`src/services/guestSession/guestSessionManager.ts`)

Pure localStorage-based session:
- `getOrCreateGuestSession()` → returns `{ guest_session_id, created_at, last_active_at, expires_at }`
- `isGuestSession()` → checks if current user is guest (no Supabase session + has guest session)
- `touchGuestSession()` → updates `last_active_at`
- `clearGuestSession()` → cleanup on registration
- Session key: `diviso_guest_session`
- Default expiry: 7 days from creation
- No Supabase tables needed — purely client-side

### 2. Guest Data Store (`src/services/guestSession/guestDataStore.ts`)

localStorage CRUD for temporary data:
- `getGuestGroups()` / `addGuestGroup(name, currency)` / `updateGuestGroup()` / `deleteGuestGroup()`
- `getGuestExpenses(groupId)` / `addGuestExpense()` / `updateGuestExpense()` / `deleteGuestExpense()`
- `getGuestPlans()` / `addGuestPlan()` / `updateGuestPlan()`
- Storage key: `diviso_guest_data`
- Each item gets a local UUID
- Groups flagged as `is_temporary: true`

### 3. Types Extension (`src/services/homeModeEngine/types.ts`)

Add to `UserDataProfile`:
```ts
identity_type: 'guest' | 'registered';
guest_session_id: string | null;
guest_temporary_groups_count: number;
guest_temporary_expenses_count: number;
guest_draft_plans_count: number;
```

Existing fields reused for guest: `has_in_progress_data`, `stale_days`, `entered_via_invite_link`, `invite_target_group_id`

### 4. Guest Profile Builder (`src/services/homeModeEngine/guestProfileBuilder.ts`)

Reads from `guestDataStore` and `guestSessionManager`:
- Counts temporary groups, expenses, plans
- Computes `stale_days` from `last_active_at`
- Sets `identity_type: 'guest'`
- Sets all registered-only fields to 0/false (owned_groups, joined_groups, etc.)
- Checks `localStorage` for invite tokens

### 5. Mode Resolver Extension (`src/services/homeModeEngine/modeResolver.ts`)

Add guest-aware branch **before** registered logic:

```ts
if (profile.identity_type === 'guest') {
  // Guest cannot be participant_mode or creator_active_mode
  if (profile.guest_temporary_groups_count > 0 && profile.guest_temporary_expenses_count > 0) {
    mode = SHARE_READY; // "Register to share this group"
  } else if (profile.stale_days >= THRESHOLDS.STALE_DAYS && profile.has_in_progress_data) {
    mode = RE_ENGAGEMENT;
  } else if (profile.has_in_progress_data) {
    mode = IN_PROGRESS;
  } else {
    mode = FIRST_ENTRY;
  }
  
  // Guest overlays
  if (profile.entered_via_invite_link) {
    overlays.push(INVITE_PRIORITY); // + AUTH_REQUIRED_GATE
    overlays.push(AUTH_REQUIRED_GATE);
  }
}
```

Key constraint: `participant_mode` and `creator_active_mode` are **never** returned for guests.

### 6. UI Config Extension (`src/services/homeModeEngine/uiModeConfig.ts`)

Add `MainSectionType` value: `'guest_onboarding'` and `'guest_share_prompt'`

Add guest-specific UI configs (separate config map for guest identity):
| Guest Mode | heroTitle | primaryCTA | mainSection |
|---|---|---|---|
| first_entry | "ابدأ بدون حساب" | أنشئ مجموعة مؤقتة | guest_onboarding |
| in_progress | "أكمل ما بدأته" | متابعة | continue_draft |
| share_ready | "سجّل لمشاركة مجموعتك" | إنشاء حساب → /auth | guest_share_prompt |
| re_engagement | "عُد من حيث توقفت" | استئناف | stale_recovery |

Function signature changes: `getHomeModeUIConfig(mode, identityType)` — returns guest variant when applicable.

### 7. `useHomeMode.ts` Extension

```ts
// Detect identity
const session = await supabase.auth.getSession();
if (session) {
  // registered flow (existing)
  profile = await buildUserDataProfile(userId);
} else if (isGuestSession()) {
  // guest flow (new)
  profile = buildGuestDataProfile();
}
```

### 8. `useGuestSession.ts` — React Hook

```ts
export function useGuestSession() {
  return {
    isGuest: boolean,
    session: GuestSession | null,
    startGuestSession: () => void,
    data: GuestDataStore,        // groups, expenses, plans
    addGroup, addExpense, ...    // CRUD wrappers
  };
}
```

### 9. `useAuthGate.ts` — Auth Gate Trigger

```ts
export function useAuthGate() {
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState('');
  
  const requireAuth = (reason: string) => {
    setGateOpen(true);
    setGateReason(reason);
  };
  
  return { gateOpen, gateReason, requireAuth, dismissGate };
}
```

### 10. `AuthRequiredGate.tsx` — Contextual Registration Dialog

A dialog/sheet that shows **why** registration is needed:
- Receives `reason` prop (i18n key)
- Shows contextual message (e.g., "سجّل لإضافة أعضاء" / "سجّل لدخول المجموعة المدعو لها")
- Primary CTA: "إنشاء حساب" → `/auth`
- Secondary: "لاحقاً"
- Stores current context in localStorage for post-registration redirect

### 11. `GuestRoute.tsx` — Route Wrapper

Like `ProtectedRoute` but allows both registered AND guest users:
- If Supabase session exists → render children (registered)
- If guest session exists → render children (guest)
- If neither → create guest session automatically, then render

Used for: `/dashboard`, `/create-group` (guest version), `/create-plan`

### 12. Route Changes (`src/App.tsx`)

Replace `ProtectedRoute` with `GuestRoute` on select routes:
- `/dashboard` → `GuestRoute` (guest sees guest dashboard)
- `/create-group` → `GuestRoute` (guest creates temporary group)
- `/create-plan` → `GuestRoute` (guest creates draft plan)

Keep `ProtectedRoute` on collaborative routes:
- `/group/:id`, `/group/:id/invite`, `/my-groups`, `/add-expense`, etc.

Invite routes (`/i/:code`): Add guest interception — if no Supabase session, store invite token + create guest session + redirect to dashboard (where auth_required_gate + invite_priority will show).

### 13. Guest Conversion (`src/services/guestSession/guestConversion.ts`)

After registration:
- `migrateGuestData(userId)`:
  - Read guest groups/expenses/plans from localStorage
  - Insert into Supabase tables under the new user ID
  - Clear guest localStorage
  - If invite token exists, redirect to invite flow
- Called from auth callback / post-registration hook

### 14. Admin Simulator Extension

Add to `ModeSimulator.tsx`:
- Toggle: `identity_type: guest | registered`
- When guest: show guest-specific fields (temporary groups, expenses counts)
- Hide registered-only fields (owned_groups, joined_groups)
- Output shows guest mode resolution + overlays including `auth_required_gate`

Add to `ModeRulesViewer.tsx`:
- Guest rules section showing which modes are available for guests
- Note that participant/creator_active are blocked for guests

Add to `modeRulesConfig.ts`:
- Guest-specific rule entries
- Updated overlay rules (auth_required_gate now active for guests)

### 15. Translation Keys

Add to `ar/dashboard.json` and `en/dashboard.json`:
```json
"guest_modes": {
  "welcome_guest": "مرحباً! ابدأ بدون حساب",
  "guest_subtitle": "أنشئ مجموعة مؤقتة وأضف مصاريفك",
  "create_temp_group": "أنشئ مجموعة مؤقتة",
  "register_to_share": "سجّل لمشاركة مجموعتك",
  "register_to_join": "سجّل للانضمام للمجموعة",
  "register_to_add_members": "سجّل لإضافة أعضاء",
  "register_to_save": "سجّل لحفظ بياناتك",
  "auth_gate_title": "مطلوب إنشاء حساب",
  "auth_gate_create_account": "إنشاء حساب",
  "auth_gate_later": "لاحقاً"
}
```

## Files Summary

| File | Action |
|---|---|
| `src/services/guestSession/guestSessionManager.ts` | Create |
| `src/services/guestSession/guestDataStore.ts` | Create |
| `src/services/guestSession/guestConversion.ts` | Create |
| `src/services/homeModeEngine/types.ts` | Edit — add guest fields |
| `src/services/homeModeEngine/guestProfileBuilder.ts` | Create |
| `src/services/homeModeEngine/modeResolver.ts` | Edit — add guest branch |
| `src/services/homeModeEngine/uiModeConfig.ts` | Edit — add guest configs |
| `src/services/homeModeEngine/modeRulesConfig.ts` | Edit — add guest rules |
| `src/services/homeModeEngine/index.ts` | Edit — exports |
| `src/hooks/useHomeMode.ts` | Edit — detect guest |
| `src/hooks/useGuestSession.ts` | Create |
| `src/hooks/useAuthGate.ts` | Create |
| `src/components/GuestRoute.tsx` | Create |
| `src/components/dashboard/AuthRequiredGate.tsx` | Create |
| `src/components/dashboard/ModeContentSection.tsx` | Edit — guest sections |
| `src/components/dashboard/HomeModeHero.tsx` | Edit — guest hero variants |
| `src/components/admin/homemode/ModeSimulator.tsx` | Edit — identity toggle |
| `src/components/admin/homemode/ModeRulesViewer.tsx` | Edit — guest rules |
| `src/pages/InviteRoute.tsx` | Edit — guest interception |
| `src/App.tsx` | Edit — GuestRoute on select routes |
| `src/i18n/locales/ar/dashboard.json` | Edit — guest keys |
| `src/i18n/locales/en/dashboard.json` | Edit — guest keys |

## Key Design Decisions

1. **No Supabase tables for guests** — purely localStorage. Simple, no auth needed, no RLS complexity.
2. **Same resolver, branched logic** — guest check is a single `if` at the top of the resolver, reusing the same mode constants.
3. **participant_mode and creator_active_mode blocked for guests** — enforced in resolver.
4. **auth_required_gate is contextual** — shows the specific reason, not a generic wall.
5. **Guest invite flow**: store token → show auth gate → after registration, auto-continue into invite.
6. **Conversion preserves progress** — guest data migrated to Supabase on registration.


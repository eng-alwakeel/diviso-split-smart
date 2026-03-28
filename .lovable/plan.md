

# Phase 3: Admin Home Mode Debug System

## Overview
Add a new "Home Modes" tab to the existing Admin Dashboard with four sections: User Inspector, Mode Simulator, Rules Reference, and UI Mapping Viewer. All logic reuses the existing engine — no duplication.

## Architecture

```text
src/components/admin/
  └── homemode/
      ├── HomeModeDebugTab.tsx       ← Tab container with 4 sub-sections
      ├── UserModeInspector.tsx      ← Lookup any user → show resolved mode
      ├── ModeSimulator.tsx          ← Manual inputs → live resolved output
      ├── ModeRulesViewer.tsx        ← All modes + conditions + overlays
      └── UIMappingViewer.tsx        ← Mode → UI config reference table
```

## Changes

### 1. `src/components/admin/homemode/HomeModeDebugTab.tsx`
Container with accordion/tabs for the 4 sections. Imports and renders each sub-component.

### 2. `UserModeInspector.tsx` — Inspect Any User
- Text input for user ID (or search by name/phone from existing admin users list)
- Calls `buildUserDataProfile(userId)` then `resolveHomeMode(profile)`
- Displays: current mode (badge), overlays (chips), resolution_reason (text block)
- Expandable `data_profile_snapshot` showing all fields in a clean key-value table
- Highlights the fields that triggered the mode decision (e.g., `owned_groups_count > 0`)

### 3. `ModeSimulator.tsx` — Interactive Simulator
- Form with number inputs for all `UserDataProfile` fields (owned_groups_count, joined_groups_count, etc.)
- Toggle switches for booleans (entered_via_invite_link, has_balance, etc.)
- Calls `resolveHomeMode()` on every change (debounced)
- Output panel showing: resolved mode, overlays, full resolution_reason
- Reset button to clear all inputs
- Preset buttons for common scenarios (first entry, participant, creator, etc.)

### 4. `ModeRulesViewer.tsx` — Rules Reference
- Renders from `MODE_PRIORITY` array and `THRESHOLDS` constants
- For each mode: name, priority number, conditions (derived from resolver logic), description
- Overlay section: shows `invite_priority` conditions + `auth_required_gate` marked as reserved
- Uses a shared `MODE_RULES_CONFIG` constant (new) that documents each mode's conditions in a structured way — keeps rules viewer in sync with resolver without duplicating if-statements

### 5. `UIMappingViewer.tsx` — UI Config Reference
- Imports `getHomeModeUIConfig()` and iterates over all modes
- For each mode: hero title, hero subtitle, primary CTA, secondary CTA, mainSectionType, showStatsGrid, showQuickActions
- Displayed as a clean table or card grid
- References the actual config values from `uiModeConfig.ts`

### 6. `src/services/homeModeEngine/modeRulesConfig.ts` — Shared Rules Documentation
New file with structured rule descriptions per mode:
```ts
export const MODE_RULES: Record<HomeMode, {
  description: string;
  conditions: string[];
  priority: number;
  exampleScenario: string;
}> = { ... }
```
Used by both `ModeRulesViewer` and potentially future docs. Keeps rule documentation centralized.

### 7. Admin Dashboard Integration
- Add "homemode" tab to `useAdminTabs.ts` ADMIN_TABS array with permission `system.settings`
- Add tab trigger + content in `AdminDashboard.tsx` rendering `<HomeModeDebugTab />`

### 8. `src/services/homeModeEngine/index.ts` — Export new config
Add export for `modeRulesConfig`.

## Key Design Decisions
- **No logic duplication**: Simulator and Inspector both call the real `resolveHomeMode()` function
- **No DB changes**: Everything reads from existing tables via `buildUserDataProfile()`
- **Admin-only**: Behind `AdminProtectedRoute` + permission check
- **No user-facing changes**: Entirely within admin dashboard

## Files
| File | Action |
|---|---|
| `src/services/homeModeEngine/modeRulesConfig.ts` | Create |
| `src/services/homeModeEngine/index.ts` | Edit — add export |
| `src/components/admin/homemode/HomeModeDebugTab.tsx` | Create |
| `src/components/admin/homemode/UserModeInspector.tsx` | Create |
| `src/components/admin/homemode/ModeSimulator.tsx` | Create |
| `src/components/admin/homemode/ModeRulesViewer.tsx` | Create |
| `src/components/admin/homemode/UIMappingViewer.tsx` | Create |
| `src/hooks/useAdminTabs.ts` | Edit — add homemode tab |
| `src/pages/AdminDashboard.tsx` | Edit — add tab trigger + content |


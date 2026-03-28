

# Phase 2: Connect Home Page UI to Home Mode Engine

## Approach
Adapt the existing `OptimizedDashboard` page by creating a UI config layer that maps each `current_home_mode` to content variations — hero text, CTA labels, section visibility, and order. One page, same shell, different content states.

## Architecture

```text
src/services/homeModeEngine/
  └── uiModeConfig.ts        ← NEW: mode → UI config mapping

src/components/dashboard/
  ├── HomeModeHero.tsx        ← NEW: mode-aware hero/greeting section
  ├── InvitePriorityCard.tsx  ← NEW: overlay card for pending invites
  ├── ModeContentSection.tsx  ← NEW: renders main/secondary sections per mode
  └── SimpleStatsGrid.tsx     ← EDIT: hide/show based on mode

src/pages/OptimizedDashboard.tsx  ← EDIT: integrate useHomeMode + render by config
```

## File Details

### 1. `src/services/homeModeEngine/uiModeConfig.ts` — Central UI Mapping

A config object per mode defining:
```ts
interface HomeModeUIConfig {
  heroTitle: string;           // i18n key
  heroSubtitle: string;        // i18n key
  primaryCTA: { label: string; route: string; icon: string };
  secondaryCTA?: { label: string; route: string; icon: string };
  showStatsGrid: boolean;      // hide stats for first_entry (all zeros)
  mainSectionType: 'onboarding' | 'continue_draft' | 'prepared_group' | 'joined_groups' | 'managed_groups' | 'stale_recovery';
  secondarySectionType?: string;
  showQuickActions: boolean;
}
```

Mode mappings:
| Mode | heroTitle | primaryCTA | showStatsGrid | mainSection |
|---|---|---|---|---|
| first_entry | "لنبدأ رحلتك الأولى" | إنشاء مجموعة → /create-group | false | onboarding |
| in_progress | "أكمل ما بدأته" | متابعة → /my-groups | true | continue_draft |
| share_ready | "مجموعتك جاهزة" | إضافة أعضاء → group invite | true | prepared_group |
| participant | "انضممت لمجموعات — أنشئ مجموعتك" | إنشاء مجموعة → /create-group | true | joined_groups |
| creator_active | "مرحباً بك!" (current) | إنشاء مجموعة / إضافة مصروف | true | managed_groups |
| re_engagement | "عُد من حيث توقفت" | استئناف → /my-groups | true | stale_recovery |

### 2. `src/components/dashboard/HomeModeHero.tsx` — Mode-Aware Hero

Replaces the static welcome section. Receives `HomeModeUIConfig` and renders:
- Title + subtitle from config
- Primary CTA button (hero variant)
- Optional secondary CTA button (outline variant)
- For `first_entry_mode`: a 3-step getting-started mini block below the CTAs
- For `creator_active_mode`: same as current (title + founding badge + help button)
- Smooth transition: same container, different text content

### 3. `src/components/dashboard/InvitePriorityCard.tsx` — Invite Overlay

Rendered when `active_overlays` includes `invite_priority`. Placed immediately after the hero section.
- Fetches pending invites using existing `useNotifications` or a lightweight query
- Shows invite card(s) with group name, inviter, and Accept/Later CTAs
- Visually distinct: primary border, subtle background highlight
- Coexists with any mode

### 4. `src/components/dashboard/ModeContentSection.tsx` — Main Content by Mode

A switch component that renders the appropriate content based on `mainSectionType`:

- **onboarding**: 3-step card (إنشاء مجموعة → إضافة مصاريف → دعوة أعضاء), no empty stats
- **continue_draft**: Surface the most relevant draft group name + "Continue" CTA
- **prepared_group**: Show the prepared group card + "Add Members" CTA
- **joined_groups**: List of joined groups with "Create Your Own" encouragement
- **managed_groups**: Current behavior — stats grid + quick actions + subscription cards (default/existing)
- **stale_recovery**: Show last active group/expense info + "Resume" CTA

For modes that aren't `creator_active` (managed_groups), hide SubscriptionStatusCard, UsageLimitsCard, and ads to reduce noise. Keep them only in creator_active mode.

### 5. `src/pages/OptimizedDashboard.tsx` — Integration

Changes:
- Import and call `useHomeMode()`
- Import `getHomeModeUIConfig()` from uiModeConfig
- Replace static welcome section with `<HomeModeHero config={uiConfig} />`
- Add `<InvitePriorityCard />` when invite_priority overlay is active
- Conditionally render `SimpleStatsGrid` based on `config.showStatsGrid`
- Replace quick actions + subscription/usage cards section with `<ModeContentSection type={config.mainSectionType} />`
- Keep AppHeader, BottomNav, QuotaWarnings, AdminCard, and AppGuide unchanged
- For `creator_active_mode`: render everything as-is (current behavior preserved)
- Fallback: if `useHomeMode` is loading or null, default to `creator_active_mode` config

### 6. `src/components/dashboard/SimpleStatsGrid.tsx` — Minor Edit

No structural changes. Just conditionally hidden via parent when `showStatsGrid = false`.

### 7. Translation Keys — `src/i18n/locales/ar/dashboard.json` + `en/dashboard.json`

Add new keys under `home_modes`:
```json
{
  "home_modes": {
    "first_entry_title": "لنبدأ رحلتك الأولى",
    "first_entry_subtitle": "أنشئ مجموعتك الأولى وابدأ بتتبع المصاريف",
    "in_progress_title": "أكمل ما بدأته",
    "in_progress_subtitle": "لديك عمل غير مكتمل",
    "share_ready_title": "مجموعتك جاهزة للخطوة التالية",
    "share_ready_subtitle": "أضف أعضاء وابدأ بالتعاون",
    "participant_title": "انضممت لمجموعات — أنشئ مجموعتك الخاصة",
    "participant_subtitle": "حان الوقت لإدارة مصاريفك بنفسك",
    "creator_active_title": "مرحباً بك!",
    "creator_active_subtitle": "إدارة ذكية للمصاريف المشتركة",
    "re_engagement_title": "عُد من حيث توقفت",
    "re_engagement_subtitle": "لديك بيانات سابقة تنتظرك",
    "onboarding_step1": "أنشئ مجموعة",
    "onboarding_step2": "أضف مصاريف",
    "onboarding_step3": "ادعُ الأعضاء",
    "continue_cta": "متابعة",
    "resume_cta": "استئناف",
    "add_members_cta": "إضافة أعضاء",
    "create_own_group_cta": "أنشئ مجموعتك",
    "view_joined_groups": "عرض المجموعات",
    "invite_card_title": "لديك دعوة جديدة",
    "invite_card_accept": "قبول الدعوة",
    "invite_card_later": "لاحقاً",
    "all_rated": "تم تقييم جميع الأعضاء"
  }
}
```

## Key Design Decisions

1. **creator_active_mode = current dashboard**: No visible change for existing active creators. This is critical for stability.
2. **participant_mode vs creator_active_mode**: Participant sees joined groups prominently + "Create Your Own" CTA. Creator sees owned groups + full financial dashboard. The distinction respects ownership.
3. **first_entry hides stats**: Showing all-zero financial cards creates noise. Replace with onboarding guidance.
4. **Invite overlay is additive**: It never replaces the mode content, just adds a card above it.
5. **Fallback safety**: If home mode engine fails or is loading, default to creator_active behavior (current UI).

## Files Affected
| File | Action |
|---|---|
| `src/services/homeModeEngine/uiModeConfig.ts` | Create — mode → UI config mapping |
| `src/components/dashboard/HomeModeHero.tsx` | Create — mode-aware hero section |
| `src/components/dashboard/InvitePriorityCard.tsx` | Create — invite overlay card |
| `src/components/dashboard/ModeContentSection.tsx` | Create — main content by mode type |
| `src/pages/OptimizedDashboard.tsx` | Edit — integrate useHomeMode + conditional rendering |
| `src/i18n/locales/ar/dashboard.json` | Edit — add home_modes keys |
| `src/i18n/locales/en/dashboard.json` | Edit — add home_modes keys |


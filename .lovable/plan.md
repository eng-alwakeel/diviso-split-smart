
# Fix Founding Program Section - Missing Translations + Premium UI

## Root Cause
The Arabic `auth.json` has only `founding_program.title` -- all other keys (`you_are_user`, `monthly_credits_section`, `monthly_credits_desc`, `activity_requirement`, `last_activity`) are missing, so raw i18n key strings render in the UI.

## Changes

### 1. Add Missing Arabic Translations (`src/i18n/locales/ar/auth.json`)

Add the following keys inside `founding_program`:
```json
"you_are_user": "أنت المستخدم رقم",
"founding_badge": "مستخدم مؤسس",
"founding_benefits_title": "كمستخدم مؤسس، ستحصل على:",
"founding_monthly": "50 نقطة شهرية مع تسجيل دخول واحد",
"founding_badge_permanent": "شارتك الدائمة",
"monthly_credits_section": "رصيدك الشهري كمستخدم مؤسس",
"monthly_credits_desc": "تحصل على 50 نقطة شهريا طالما تحافظ على نشاطك داخل التطبيق.",
"activity_requirement": "يشترط تسجيل نشاط مرة واحدة على الأقل شهريا للحفاظ على الامتياز.",
"last_activity": "آخر نشاط",
"founding_user_tooltip": "مستخدم مؤسس #{{number}}",
"free_enhanced": "استخدام مجاني مع حدود محسّنة",
"remaining": "{{remaining}} من {{limit}} متبقي",
"closed": "تم إغلاق البرنامج",
"spots_remaining": "{{remaining}} من 1000 مقعد متبقي"
```

### 2. Upgrade UI to Premium Card (`src/components/settings/ProfileTab.tsx`)

Replace the current founding section (lines 662-697) with a premium gold card:

- **Header**: Crown icon + "مستخدم مؤسس #N" as main title (bold, larger)
- **Subtitle**: "أنت من أوائل 1,000 مستخدم في Diviso"
- **Benefits list** with sparkle/check icons:
  - 50 نقطة مجانية شهريا
  - أولوية في الميزات الجديدة
  - شارة مميزة في البروفايل
- **FoundingBadge** centered
- **Last activity** line with clock icon
- Gold gradient background kept (from-amber-500/10) but enhanced with slightly stronger amber border and shadow
- Condition: only render if `isFoundingUser && userNumber && userNumber <= 1000`

### 3. Update English Translations (minor cleanup)

The English `auth.json` already has the keys but update `you_are_user` and `monthly_credits_desc` to match the improved copy:
- `you_are_user` -> "You are user number"  (already correct)
- `monthly_credits_desc` -> "You receive 50 credits every month as long as you stay active." (update from "You get 50 points monthly")

## Files Affected

| File | Change |
|---|---|
| `src/i18n/locales/ar/auth.json` | Add ~12 missing `founding_program.*` keys |
| `src/i18n/locales/en/auth.json` | Minor copy improvements to 2 existing keys |
| `src/components/settings/ProfileTab.tsx` | Redesign founding section (lines 662-697) to premium card with benefits list |

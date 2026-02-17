

# Update Use-Case List to Ramadan Theme

## Change
Replace the five use-case items under the hero headline with Ramadan-relevant ones. Text-only change in translation files.

## Current vs New

| # | Current (AR) | New (AR) |
|---|-------------|----------|
| 1 | سفر | عمرة |
| 2 | سكن مشترك | إفطار جماعي |
| 3 | طلعة أصدقاء | سحور أصدقاء |
| 4 | نشاط | سفر |
| 5 | رحلة بر | سكن مشترك |

## Technical Steps

### 1. Edit `src/i18n/locales/ar/landing.json`
Update `hero.useCases`:
- `travel` -> `"عمرة"`
- `housing` -> `"إفطار جماعي"`
- `friends` -> `"سحور أصدقاء"`
- `activities` -> `"سفر"`
- `camping` -> `"سكن مشترك"`

### 2. Edit `src/i18n/locales/en/landing.json`
Update `hero.useCases` with English equivalents:
- `travel` -> `"Umrah"`
- `housing` -> `"Group Iftar"`
- `friends` -> `"Suhoor with Friends"`
- `activities` -> `"Travel"`
- `camping` -> `"Shared Housing"`

### No component changes
`HeroSection.tsx` already maps over these five keys with the dot separator -- layout, typography, and spacing stay identical.


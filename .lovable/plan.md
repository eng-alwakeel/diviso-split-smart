

# Update Hero H1 to Ramadan Version

## Change
Replace the main H1 text content with the Ramadan version. No layout, styling, or structural changes.

## Technical Steps

### 1. Edit `src/i18n/locales/ar/landing.json`
- Change `hero.mainTitle` from `"ينظّم أي مشاركة بين أكثر من شخص"` to `"ينظّم مصاريف رمضان بين أكثر من شخص"`

### 2. Edit `src/i18n/locales/en/landing.json`
- Change `hero.mainTitle` to an English equivalent, e.g. `"organizes Ramadan expenses between people"`

### 3. No changes to `HeroSection.tsx`
The component already renders `<span className="text-primary">Diviso</span> {t('hero.mainTitle')}` -- the "Diviso" styling stays intact automatically. Only the translation value changes.


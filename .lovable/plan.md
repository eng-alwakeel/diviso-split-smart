
# Ramadan Hero Banner

## Overview
Add a seasonal Ramadan banner section at the very top of the homepage, placed between the Header and the existing HeroSection. It will use the existing dark gradient background, primary (lime green) glow accents, and brand typography -- blending seamlessly with the current design.

## What You'll See
- A compact, full-width dark banner above the main hero
- Arabic headline: "رمضان يجمعنا… و Diviso يرتّبها بينكم"
- Subtext: "نظّم مشاركاتكم ومصاريفكم بسهولة خلال رمضان"
- A very subtle crescent SVG rendered in the primary color at low opacity, used as a decorative accent
- Fully responsive, RTL-aware, no new colors or visual styles

## Technical Details

### 1. New Component: `src/components/landing/RamadanHeroBanner.tsx`
- Uses `bg-gradient-dark` background (matching existing hero)
- Primary-colored glow orb (`bg-primary/20 blur-2xl`) as soft ambient light
- Tiny inline SVG crescent in `hsl(var(--primary))` at 20-30% opacity
- Headline in `text-white` with `text-primary` on "Diviso" (same pattern as HeroSection h1)
- Subtext in `text-white/70`
- RTL-aware via `useTranslation` and `dir` attribute
- No animations or heavy assets -- pure CSS + tiny SVG

### 2. Edit: `src/pages/Index.tsx`
- Import `RamadanHeroBanner`
- Place it right after `<Header />` and before `<HeroSection />`

### 3. Translations: `src/i18n/locales/ar/landing.json` and `en/landing.json`
- Add `ramadan.headline` and `ramadan.subtext` keys in both languages
- Arabic values as specified; English equivalents for the EN locale

### Component Structure
```text
+--------------------------------------------------+
| Header (sticky)                                  |
+--------------------------------------------------+
| RamadanHeroBanner                                |
|  [soft primary glow orb]                         |
|  [tiny crescent SVG accent]                      |
|  "رمضان يجمعنا… و Diviso يرتّبها بينكم"          |
|  "نظّم مشاركاتكم ومصاريفكم بسهولة خلال رمضان"    |
+--------------------------------------------------+
| HeroSection (existing, unchanged)                |
+--------------------------------------------------+
```

### Performance
- No images, no lazy loading needed -- just CSS gradients, a tiny inline SVG, and text
- No JavaScript logic beyond reading the current language
- Zero impact on LCP/CLS

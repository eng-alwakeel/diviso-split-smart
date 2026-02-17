

# Integrate Ramadan Message Into the Hero Section

## What Changes

Remove `RamadanHeroBanner` as a separate section. Instead, add a small Ramadan tagline **inside** the existing `HeroSection`, placed just above the main `h1` headline. This eliminates the stacked/layered feeling and makes it feel native.

## Visual Result

The hero will look like this (single section, no extra blocks):

```text
+--------------------------------------------------+
| Header                                           |
+--------------------------------------------------+
| HeroSection (same bg-gradient-hero)              |
|                                                  |
|  "رمضان يجمعنا… و Diviso يرتّبها بينكم"  <-- small tagline |
|                                                  |
|  Diviso ينظّم أي مشاركة...     <-- existing h1  |
|  [use cases • travel • housing...]               |
|  [value description]                             |
|  [CTA button]                                    |
|  ...                                             |
+--------------------------------------------------+
```

The Ramadan line will be a subtle `text-sm md:text-base` tagline in `text-white/70` with "Diviso" in `text-primary`, sitting above the h1 with a small bottom margin. No extra gradients, no glow orbs, no crescent -- just text that blends into the existing hero.

## Technical Steps

### 1. Edit `src/components/HeroSection.tsx`
- Add the Ramadan tagline as a `<p>` element right above the `<h1>` (line 51)
- Style: `text-sm md:text-base text-white/70 mb-3` -- smaller than the main title, subtle
- Use existing translation keys (`ramadan.headline_pre`, `ramadan.headline_post`)
- For Arabic, render the hardcoded Arabic text directly (same pattern already used)

### 2. Edit `src/pages/Index.tsx`
- Remove `<RamadanHeroBanner />` from the page (line 83)
- Remove the import of `RamadanHeroBanner` (line 18)

### 3. Keep `RamadanHeroBanner.tsx` file
- Leave it in place (can be cleaned up later) -- the import removal is sufficient

## What Stays the Same
- The existing hero gradient, spacing, layout grid, brand art, steps, CTA -- all untouched
- The Ramadan message is just one line of text added inside the existing text column
- No new colors, no new visual elements, no extra sections

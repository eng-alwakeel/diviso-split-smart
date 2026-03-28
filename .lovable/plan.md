

# Phase: 12 Bilingual SEO Landing Pages

## Current State
- 7 English-only SEO pages exist at root routes (`/split-expenses`, `/splitwise-alternative`, etc.)
- `SEOLandingPageData` interface is English-only — no Arabic fields
- `SEOLandingPage` component renders English-only, LTR
- `SEOLandingPageRoute` resolves pages by `pathname` match against `route` field
- All routes are individually hardcoded in `App.tsx`

## Architecture Approach

**Extend the existing system** rather than creating a new one:
- Add `lang` field to `SEOLandingPageData` (`'en' | 'ar'`)
- Add Arabic-specific fields or make the existing interface language-aware
- Use wildcard routes (`/en/*`, `/ar/*`) instead of 24 individual route entries
- Update `SEOLandingPage` component to support RTL rendering when `lang === 'ar'`

## Data Model Extension

Add to `SEOLandingPageData`:
```ts
lang: 'en' | 'ar';
dir: 'ltr' | 'rtl';
hreflangPair?: string; // route of the alternate language version
```

Each page entry is a standalone record (no nested ar/en). Arabic pages are separate entries with Arabic content in the same fields. Paired via `hreflangPair` for cross-linking and `<link rel="alternate" hreflang>`.

## The 12 Page Pairs (22 total entries)

| # | English Route | Arabic Route | Has Arabic |
|---|---|---|---|
| 1 | `/en/split-expenses-with-friends` | `/ar/تقسيم-المصاريف-بين-الأصدقاء` | Yes |
| 2 | `/en/group-travel-expense-tracker` | `/ar/تقسيم-تكاليف-الرحلات` | Yes |
| 3 | `/en/split-bills-roommates` | `/ar/تقسيم-الفواتير-بين-السكن` | Yes |
| 4 | `/en/shared-expense-tracker` | `/ar/إدارة-المصاريف-المشتركة` | Yes |
| 5 | `/en/group-budget-planner` | `/ar/إنشاء-ميزانية-للمجموعة` | Yes |
| 6 | `/en/how-to-split-bills` | `/ar/كيف-تقسم-المصاريف` | Yes |
| 7 | `/en/how-to-manage-group-expenses` | `/ar/إدارة-المصاريف-الجماعية` | Yes |
| 8 | `/en/settle-expenses-easily` | `/ar/تسوية-المصاريف-بسهولة` | Yes |
| 9 | `/en/splitwise-alternative` | — | No |
| 10 | `/en/best-expense-sharing-app` | — | No |
| 11 | `/en/avoid-financial-conflicts-friends` | `/ar/تجنب-الخلافات-المالية-بين-الأصدقاء` | Yes |
| 12 | `/en/split-trip-costs-best-way` | `/ar/أفضل-طريقة-لتقسيم-تكاليف-الرحلة` | Yes |

## Content Strategy Per Page

Each entry contains unique, intent-focused content:
- **H1** targeting the primary keyword
- **heroSubtitle** — benefit-driven, not generic
- **bodyContent** — 3 paragraphs: problem, how Diviso helps, practical example
- **features** — 6 relevant features per page
- **useCases** — 4 scenario cards
- **faqs** — 4-5 unique questions with FAQ JSON-LD
- **ctaText/ctaSubtext** — conversion-focused, action-specific
- **relatedPages** — cross-link to other SEO pages (both old root-level and new `/en/`, `/ar/` pages)

Arabic pages: genuinely localized content, not machine translation. Natural Arabic wording, culturally relevant examples (e.g., "رحلة العمرة" instead of "bachelor party"), search-friendly terminology.

## Component Updates

### `SEOLandingPage.tsx`
- Accept `lang` and `dir` from data
- Set `dir="rtl"` on container when Arabic
- Pass `lang` to `<SEO>` component
- Add `hreflang` link tags when `hreflangPair` exists
- Adjust header CTA text based on language ("Get Started Free" / "ابدأ مجاناً")
- Social proof text localized
- Footer links remain the same

### `SEOLandingPageRoute.tsx`
- No change needed — already resolves by `pathname` match

## Routing

Add two wildcard catch-all routes in `App.tsx`:
```tsx
<Route path="/en/*" element={<LazySEOLandingPage />} />
<Route path="/ar/*" element={<LazySEOLandingPage />} />
```

The existing `getSEOPageByRoute(pathname)` handles lookup — each page's `route` field matches the full path (e.g., `/en/split-expenses-with-friends`).

## Internal Linking Strategy

- New pages link to each other via `relatedPages`
- New pages link to existing root-level SEO pages (`/split-expenses`, `/splitwise-alternative`)
- Existing root-level pages get updated `relatedPages` to include relevant new pages
- Pages link to `/faq` and `/blog` where relevant

## Technical SEO

- Canonical URLs set via `<SEO canonical=...>`
- `hreflang` tags on paired pages (en↔ar)
- FAQ JSON-LD schema on every page (existing)
- `sitemap.xml` updated with all 22 new URLs
- `robots.txt` already allows `/en/` and `/ar/` paths

## Files Summary

| File | Action |
|---|---|
| `src/content/seo-pages/seoLandingPagesData.ts` | Edit — add `lang`, `dir`, `hreflangPair` to interface + 22 new page entries |
| `src/components/seo/SEOLandingPage.tsx` | Edit — RTL support, localized strings, hreflang tags |
| `src/App.tsx` | Edit — add `/en/*` and `/ar/*` wildcard routes |
| `public/sitemap.xml` | Edit — add 22 new URLs with hreflang |

## Key Decisions
1. **Flat data model** — Arabic pages are separate entries, not nested translations. Simpler lookup, no resolver complexity.
2. **Wildcard routes** — 2 route entries instead of 22. Scales automatically.
3. **Existing root pages preserved** — the 7 current pages at `/split-expenses` etc. remain untouched, just get updated `relatedPages`.
4. **No new components** — reuse and extend `SEOLandingPage` with RTL awareness.


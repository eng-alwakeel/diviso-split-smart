## Goal
Create a public page that explains to users how to delete their account (required by Google Play policy), and link it from the footer in both Arabic and English.

## Steps

1. **Create page** `src/pages/DeleteAccount.tsx`
   - Public route, accessible without auth.
   - Bilingual via `useTranslation`.
   - Sections:
     - Intro: how account deletion works in Diviso.
     - Method 1 (in-app): Settings → Account → Delete Account.
     - Method 2 (by email): send request to support@diviso.app from registered email; response within 7 days.
     - What gets deleted: profile, groups owned, expenses, payment methods, notifications, reputation.
     - What's retained (and why): invoices/financial records retained per Saudi ZATCA/tax law for required period; anonymized analytics.
     - Timeline: immediate logout, 30-day soft delete window, then permanent.
     - Contact: support@diviso.app.

2. **Add route** in `src/App.tsx`: `/delete-account` → `DeleteAccount` (lazy-loaded, public).

3. **Translations**
   - Add `footer.deleteAccount` key to `src/i18n/locales/ar/landing.json` ("حذف الحساب") and `src/i18n/locales/en/landing.json` ("Delete Account").
   - Add new namespace `deleteAccount` (ar + en) with all section copy.

4. **Footer link** in `src/components/Footer.tsx`
   - Add `<Link to="/delete-account">` under "Useful Links" near privacy/terms, using `t('footer.deleteAccount')`.

5. **SEO**
   - Page sets `<title>` and meta description via existing pattern (check PrivacyPolicy.tsx for reference).
   - Add to `public/sitemap.xml`.

## Notes
- No backend changes; deletion mechanism already exists in Settings (per memory + account-management docs).
- Style: match PrivacyPolicy/TermsConditions pages for consistency.
- RTL handled automatically by existing i18n/dir setup.



# إصلاح مشاكل SEO التقنية

## المشاكل المكتشفة

1. **CSP meta tag في `useSecurityHeaders.ts`** يحظر موارد خارجية (Google Fonts, Analytics, Supabase Storage) — لكنه غير مستخدم حالياً في أي مكان
2. **`sitemap.xml`** تاريخ آخر تعديل قديم (2026-01-24) — يحتاج تحديث
3. **`dateModified` في Structured Data** بـ `index.html` قديم (2026-01-18)
4. **SPA routing** — كل الصفحات تقدم نفس `index.html` مع نفس meta tags الثابتة. الـ SEO component يعدّلها بـ JS لكن بعض المحركات لا تنفذ JS
5. **`og-image.png`** — يجب التأكد من وجوده فعلياً في `/public`

## التغييرات المقترحة

### 1. تحديث `index.html`
- تحديث `dateModified` في Structured Data إلى تاريخ اليوم
- إضافة `<noscript>` tag مع محتوى أساسي للزوار بدون JS (محركات بحث بسيطة)

### 2. تحديث `public/sitemap.xml`
- تحديث `lastmod` لكل الصفحات إلى 2026-03-13

### 3. إصلاح `useSecurityHeaders.ts`
- تحديث CSP ليشمل Google Fonts وAnalytics وSupabase Storage domains
- أو حذف الـ CSP meta tag لأنه يسبب مشاكل أكثر مما يحل (CSP عبر meta tags محدود)

### 4. التأكد من وجود `og-image.png`
- فحص `/public/og-image.png` وإنشاء placeholder إذا غير موجود




# إضافة شرح خطوات التثبيت في صفحة /install

## المشكلة
صفحة `/install` تعرض فقط العنوان والفوائد، لكن لا تحتوي على شرح واضح لطريقة التثبيت خطوة بخطوة. الـ `InstallWidget` يعتمد على `shouldShow` ويختفي إذا تم رفضه أو التثبيت، وتعليمات iOS مخفية داخل bottom sheet تظهر فقط عند الضغط على زر.

## الحل
إضافة قسم جديد في صفحة `/install` يعرض خطوات التثبيت مباشرة على الصفحة لكل نظام (iOS و Android/Desktop) بدون ما يحتاج المستخدم يضغط على شيء.

### التغييرات

#### 1. `src/pages/Install.tsx`
- إضافة قسم "كيف تثبّت التطبيق" بعد قسم الفوائد
- عرض تعليمات iOS (خطوات Safari + Share + Add to Home Screen) دائماً
- عرض تعليمات Android/Chrome (قائمة المتصفح + Install App)
- استخدام tabs أو أقسام منفصلة حسب النظام
- إبقاء زر التثبيت المباشر للأجهزة التي تدعم `beforeinstallprompt`

#### 2. `src/i18n/locales/en/install.json` و `src/i18n/locales/ar/install.json`
- إضافة مفاتيح ترجمة جديدة لقسم الخطوات:
  - `steps.title` — "How to install"
  - `steps.iosTitle` — "On iPhone (Safari)"
  - `steps.androidTitle` — "On Android (Chrome)"
  - خطوات Android: Open menu → tap "Install App" / "Add to Home Screen"

#### 3. `src/components/pwa/InstallSteps.tsx` (ملف جديد)
- كمبوننت يعرض خطوات التثبيت لكل نظام
- يكتشف النظام تلقائياً ويعرض الخطوات المناسبة أولاً
- تصميم بصري واضح بأرقام وأيقونات (مشابه لـ `IosInstallSheet`)

### الملفات المتأثرة
- `src/pages/Install.tsx` — إضافة قسم الخطوات
- `src/components/pwa/InstallSteps.tsx` — كمبوننت جديد
- `src/i18n/locales/en/install.json` — مفاتيح ترجمة جديدة
- `src/i18n/locales/ar/install.json` — مفاتيح ترجمة جديدة


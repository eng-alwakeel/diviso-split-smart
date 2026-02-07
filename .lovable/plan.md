

# ترجمة صفحة التنزيل (Install) ومكونات PWA للغتين

## المشكلة

صفحة `/install` وجميع مكونات PWA المرتبطة فيها (InstallWidget, PwaInstallPrompt, ShareInstallButton, IosInstallSheet) كل النصوص فيها مكتوبة بالعربي فقط (hardcoded) بدون استخدام نظام الترجمة i18n.

## الحل

1. إنشاء ملفات ترجمة جديدة `install.json` بالعربي والإنجليزي
2. تسجيل الـ namespace الجديد في `i18n/index.ts`
3. تحديث جميع المكونات لاستخدام `useTranslation('install')`

---

## الملفات المطلوب إنشاؤها

### 1. `src/i18n/locales/ar/install.json` (جديد)

يحتوي على جميع النصوص العربية الموجودة حالياً:
- نصوص الصفحة الرئيسية (العنوان، الوصف، المزايا)
- نصوص InstallWidget (لكل موقع: home, faq, settings, appHome)
- نصوص PwaInstallPrompt (زر التثبيت، تحذير المتصفح)
- نصوص ShareInstallButton (زر المشاركة، رسالة النسخ)
- نصوص IosInstallSheet (خطوات التثبيت على الآيفون)

### 2. `src/i18n/locales/en/install.json` (جديد)

الترجمة الإنجليزية لجميع النصوص أعلاه.

---

## الملفات المطلوب تعديلها

### 3. `src/i18n/index.ts`

- إضافة import لملفات `install.json` (عربي وإنجليزي)
- إضافة `install` في الـ resources لكلا اللغتين
- إضافة `'install'` في مصفوفة `ns`

### 4. `src/pages/Install.tsx`

- إضافة `useTranslation('install')`
- استبدال جميع النصوص المكتوبة مباشرة بمفاتيح ترجمة:
  - SEO title و description
  - عنوان الصفحة ووصفها
  - نصوص المزايا الثلاث (اسرع، مثل التطبيق، إشعارات)
  - نص "أرسل الرابط..."

### 5. `src/components/pwa/InstallWidget.tsx`

- إضافة `useTranslation('install')`
- استبدال الكائن `COPY` الثابت بمفاتيح ترجمة ديناميكية مثل:
  `t('widget.home.title')`, `t('widget.home.subtitle')`

### 6. `src/components/pwa/PwaInstallPrompt.tsx`

- إضافة `useTranslation('install')`
- ترجمة:
  - نص زر "تثبيت التطبيق"
  - aria-label لزر الإخفاء
  - رسالة تحذير المتصفح الداخلي (in-app browser warning)

### 7. `src/components/pwa/ShareInstallButton.tsx`

- إضافة `useTranslation('install')`
- ترجمة:
  - عنوان ونص المشاركة (SHARE_PAYLOAD)
  - نص زر "شارك رابط التثبيت"
  - رسائل toast (تم النسخ)
  - aria-label

### 8. `src/components/pwa/IosInstallSheet.tsx`

- إضافة `useTranslation('install')`
- ترجمة:
  - عنوان الـ drawer
  - الخطوات الأربع (Safari, المشاركة, Add to Home Screen, Add)
  - زر "فهمت، شكراً"

---

## هيكل مفاتيح الترجمة

```text
install.json
+-- page
|   +-- seoTitle
|   +-- seoDescription
|   +-- title
|   +-- subtitle
|   +-- shareHint
|   +-- benefits
|       +-- faster / fasterDesc
|       +-- appLike / appLikeDesc
|       +-- notifications / notificationsDesc
+-- widget
|   +-- home / faq / settings / appHome
|       +-- title / subtitle
+-- prompt
|   +-- installButton
|   +-- dismissLabel
|   +-- inAppWarning
+-- share
|   +-- buttonText
|   +-- shareTitle
|   +-- shareText
|   +-- copiedToast
|   +-- copyPrompt
|   +-- ariaLabel
+-- ios
    +-- title
    +-- step1Title / step1Desc
    +-- step2
    +-- step3
    +-- step4
    +-- doneButton
```

## ملخص

| الملف | العملية |
|-------|---------|
| `src/i18n/locales/ar/install.json` | إنشاء جديد |
| `src/i18n/locales/en/install.json` | إنشاء جديد |
| `src/i18n/index.ts` | تسجيل namespace جديد |
| `src/pages/Install.tsx` | استخدام مفاتيح ترجمة |
| `src/components/pwa/InstallWidget.tsx` | استخدام مفاتيح ترجمة |
| `src/components/pwa/PwaInstallPrompt.tsx` | استخدام مفاتيح ترجمة |
| `src/components/pwa/ShareInstallButton.tsx` | استخدام مفاتيح ترجمة |
| `src/components/pwa/IosInstallSheet.tsx` | استخدام مفاتيح ترجمة |


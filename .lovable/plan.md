
# خطة تنفيذ PWA + زر تثبيت ذكي

## الوضع الحالي

المشروع عنده بالفعل:
- ملف `manifest.json` في `public/` (يحتاج تحسين الأيقونات)
- ملف `sw.js` يدوي في `public/` مع كاش وإشعارات
- تسجيل Service Worker في `index.html`
- hook `useServiceWorkerUpdate` لتتبع التحديثات
- meta tags لـ iOS في `index.html`
- أيقونة واحدة `favicon.png` تُستخدم لكل الأحجام

**لا يوجد**: `vite-plugin-pwa` ولا أي زر تثبيت ذكي.

## القرار التقني المهم

**لن نستخدم `vite-plugin-pwa`** لأن المشروع عنده بالفعل Service Worker يدوي متقدم (كاش، إشعارات، background sync) وتسجيل في `index.html`. إضافة `vite-plugin-pwa` ستتعارض مع هذا الإعداد وتسبب مشاكل. بدلاً من ذلك سنحسّن الإعداد الحالي ونضيف زر التثبيت الذكي.

---

## المرحلة 1: تحسين manifest.json وإضافة أيقونات PWA

### 1.1 إنشاء أيقونات PWA
- إنشاء `public/pwa-192.png` و `public/pwa-512.png` و `public/pwa-512-maskable.png`
- سنستخدم `favicon.png` الموجود كأساس (نسخة مؤقتة)

### 1.2 تحديث `public/manifest.json`
- إضافة أيقونات بأحجام صحيحة مع `purpose` منفصل (لأن `any maskable` معاً غير مُوصى به)
- التأكد من أن كل الحقول المطلوبة موجودة

### 1.3 تحديث `index.html`
- إضافة `apple-touch-icon` بحجم صحيح
- التأكد من ربط الـ manifest

---

## المرحلة 2: إنشاء Hook ذكي للتثبيت

### 2.1 إنشاء `src/hooks/usePwaInstall.ts`
هذا الـ hook يدير كل منطق التثبيت:
- يستمع لـ `beforeinstallprompt` (أندرويد/كروم)
- يكتشف iOS vs Android
- يكتشف إذا التطبيق مثبت (standalone mode)
- يكتشف إذا المستخدم داخل in-app browser (واتساب/إنستغرام)
- يكتشف Safari على iOS
- يدير حالة الإخفاء عبر `localStorage` (مفتاح عالمي واحد)
- يوفر دالة `triggerInstall()` لتنفيذ التثبيت

---

## المرحلة 3: إنشاء مكونات واجهة التثبيت

### 3.1 إنشاء `src/components/pwa/PwaInstallPrompt.tsx`
المكون الرئيسي - بطاقة أنيقة تتوافق مع تصميم Diviso:
- عنوان ووصف قابلين للتخصيص
- زر "تثبيت" يشغل `beforeinstallprompt` على أندرويد
- زر "تثبيت" يفتح تعليمات iOS على آيفون
- زر "إخفاء" يخزن في `localStorage` بمفتاح عالمي
- تنبيه "افتح من Safari" إذا المستخدم في in-app browser
- يختفي تلقائياً إذا التطبيق مثبت أو تم إخفاؤه
- يستخدم ألوان وتنسيقات Tailwind + shadcn الموجودة

### 3.2 إنشاء `src/components/pwa/IosInstallSheet.tsx`
Bottom Sheet (باستخدام `vaul` الموجود بالفعل) يعرض خطوات التثبيت على iOS:
1. افتح من Safari
2. اضغط زر المشاركة
3. اختر "Add to Home Screen"
4. اضغط "Add"

### 3.3 إنشاء `src/components/pwa/InstallWidget.tsx`
مكون wrapper يحدد النص حسب الصفحة:

| الصفحة | العنوان | النمط |
|--------|---------|-------|
| الرئيسية `/` | "ثبّت Diviso -- أسرع لك" | primary (بارز) |
| FAQ `/faq` | "كيف أثبّت Diviso؟" | primary |
| الإعدادات `/settings` | "تثبيت التطبيق" | ghost (هادئ) |
| الداشبورد `/dashboard` | "ثبّت Diviso لجلسات أسرع" | primary |

---

## المرحلة 4: إدراج الويدجت في الصفحات الأربع

### 4.1 الصفحة الرئيسية `src/pages/Index.tsx`
- إضافة `<InstallWidget where="home" />` بعد `InteractiveSplitDemo` وقبل الأقسام المؤجلة

### 4.2 صفحة FAQ `src/pages/FAQ.tsx`
- إضافة `<InstallWidget where="faq" />` قبل قسم "Contact CTA" في الأسفل

### 4.3 صفحة الإعدادات `src/pages/Settings.tsx`
- إضافة `<InstallWidget where="settings" />` بعد وصف الصفحة وقبل الـ Tabs

### 4.4 الداشبورد `src/pages/Dashboard.tsx`
- إضافة `<InstallWidget where="appHome" />` بعد `OnboardingProgress` وقبل Stats Grid

---

## المرحلة 5: صفحة تثبيت مستقلة (اختياري)

### 5.1 إنشاء `src/pages/Install.tsx`
- صفحة بسيطة على route `/install`
- تعرض `InstallWidget` مع شرح إضافي
- مفيدة كرابط يُشارك في أي مكان

### 5.2 تحديث `src/App.tsx`
- إضافة Route جديد `/install`

---

## هيكل الملفات

```text
src/
+-- hooks/
|   +-- usePwaInstall.ts              (جديد)
+-- components/
|   +-- pwa/
|       +-- PwaInstallPrompt.tsx       (جديد)
|       +-- IosInstallSheet.tsx        (جديد)
|       +-- InstallWidget.tsx          (جديد)
+-- pages/
|   +-- Install.tsx                    (جديد)
|   +-- Index.tsx                      (تعديل)
|   +-- FAQ.tsx                        (تعديل)
|   +-- Settings.tsx                   (تعديل)
|   +-- Dashboard.tsx                  (تعديل)
|   +-- App.tsx                        (تعديل - route جديد)
public/
+-- manifest.json                      (تحسين)
+-- pwa-192.png                        (جديد - نسخة من favicon.png)
+-- pwa-512.png                        (جديد - نسخة من favicon.png)
+-- pwa-512-maskable.png               (جديد - نسخة من favicon.png)
```

---

## منطق الإخفاء العالمي

```text
المفتاح: "diviso_install_dismissed"
+-- اذا الزر ضغط "اخفاء" في اي صفحة --> يختفي من كل الصفحات
+-- اذا التطبيق مثبت (standalone) --> يختفي تلقائيا
+-- اذا المستخدم ثبت التطبيق (appinstalled) --> يختفي تلقائيا
```

---

## ملاحظات تقنية مهمة

1. **لا نستخدم `vite-plugin-pwa`** - المشروع عنده SW يدوي متقدم ولا نريد تعارض
2. **لا نعدل `sw.js`** - الـ Service Worker الحالي يعمل ممتاز
3. **لا نعدل `main.tsx`** - تسجيل SW موجود في `index.html`
4. المكونات تستخدم **Tailwind + shadcn** الموجودين
5. `IosInstallSheet` يستخدم مكتبة **vaul** (Drawer) الموجودة بالفعل
6. الأيقونات مؤقتة من `favicon.png` - يمكن استبدالها لاحقاً بأيقونات مخصصة



# حل مشكلة OG Tags لصفحة الإنفلونسر `/from`

## المشكلة

عند مشاركة رابط `diviso.app/from` على WhatsApp، تظهر بيانات الصفحة الرئيسية:
- العنوان: "Diviso | قسّم بذكاء، سافر براحة"
- الوصف: "قسّم المصاريف بين الأصدقاء والع..."

بدلاً من البيانات المخصصة:
- العنوان: "تطبيق خلّى القسمة أوضح بيننا"
- الوصف: "استخدمته في الطلعات وراح يريحك من لخبطة الحساب"

## السبب التقني

WhatsApp وباقي تطبيقات المشاركة (Telegram, Facebook, Twitter) لا تنفذ JavaScript. تقرأ فقط HTML الأولي من index.html، وبما أن التطبيق SPA (Single Page Application)، فإن OG tags الموجودة في index.html هي الوحيدة التي تُرى.

```text
+-------------------+     +------------------+     +------------------+
|   User Shares     | --> | WhatsApp Crawler | --> | Reads index.html |
|   /from link      |     | (No JavaScript)  |     | (Default OG)     |
+-------------------+     +------------------+     +------------------+
```

## الحل المقترح: Edge Function للـ Dynamic OG Tags

سننشئ Edge Function تعمل كـ "gateway" للروابط المخصصة. عندما يطلب crawler رابط `/from`، يحصل على HTML مخصص مع OG tags الصحيحة.

### الخطوات:

---

### 1. إنشاء Edge Function: `og-handler`

**الملف**: `supabase/functions/og-handler/index.ts`

```text
الوظيفة:
├── استقبال طلب من Cloudflare/Vercel edge
├── تحديد الصفحة من الـ path (/from, /launch, /lp/*)
├── إرجاع HTML مع OG tags المخصصة
└── إعادة التوجيه للتطبيق الأصلي للمستخدمين
```

### 2. منطق التعرف على Crawlers

```text
User-Agent patterns للتعرف على crawlers:
- WhatsApp: "WhatsApp"
- Telegram: "TelegramBot"
- Facebook: "facebookexternalhit"
- Twitter: "Twitterbot"
- LinkedIn: "LinkedInBot"
```

### 3. خريطة الصفحات وبياناتها

| الصفحة | OG:title | OG:description |
|--------|----------|----------------|
| `/from` | تطبيق خلّى القسمة أوضح بيننا | استخدمته في الطلعات وراح يريحك من لخبطة الحساب |
| `/launch` | القسمة دايمًا تلخبط؟ خلّها واضحة | تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش |

### 4. تحديث إعدادات الـ Routing

نحتاج إعداد redirect rule في Cloudflare/Vercel لتوجيه crawlers إلى Edge Function.

---

## التنفيذ التقني

### الملفات الجديدة:

| الملف | الوظيفة |
|-------|---------|
| `supabase/functions/og-handler/index.ts` | Edge Function لتوليد HTML مع OG tags |

### الملفات المعدلة:

| الملف | التعديل |
|-------|---------|
| `public/_redirects` أو Cloudflare Workers | توجيه crawler requests |

---

## بديل أبسط (مؤقت): Pre-render HTML Files

إنشاء ملفات HTML ثابتة في مجلد public لكل صفحة تحتاج OG مخصص:

**الملف**: `public/from/index.html`

هذا الملف سيحتوي على:
- OG tags الصحيحة
- JavaScript redirect للتطبيق الأصلي

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta property="og:title" content="تطبيق خلّى القسمة أوضح بيننا">
  <meta property="og:description" content="استخدمته في الطلعات وراح يريحك من لخبطة الحساب">
  <meta property="og:image" content="https://diviso.app/og-image.png">
  <meta property="og:url" content="https://diviso.app/from">
  <!-- Redirect بعد قراءة OG -->
  <script>window.location.href = '/from';</script>
</head>
</html>
```

---

## التوصية

**الحل السريع**: إنشاء ملف `public/from.html` ثابت مع OG tags الصحيحة.

**الحل الدائم**: Edge Function مع routing ذكي للتعامل مع جميع الصفحات المخصصة.

---

## ملاحظة مهمة

بسبب طريقة عمل Vite و React Router، الحل الأبسط هو إنشاء ملفات HTML ثابتة في `public/` للصفحات التي تحتاج OG مخصص. هذه الملفات ستُخدم مباشرة قبل React.


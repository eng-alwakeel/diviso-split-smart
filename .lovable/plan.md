

# حل مشكلة OG Tags - تحليل وخطة

## المشكلة المكتشفة

بعد فحص الموقع المنشور، تبين أن ملفات HTML الثابتة (`public/launch/index.html` و `public/from/index.html`) **لا تُخدم** للزوار. بدلاً من ذلك، يتم توجيه جميع الطلبات إلى `index.html` الرئيسي (SPA routing).

```text
الطلب: diviso.app/launch
المتوقع: public/launch/index.html (مع OG tags مخصصة)
الفعلي: index.html (مع OG tags الافتراضية) → React Router
```

## السبب

Lovable/Vite يستخدم **SPA fallback routing** - جميع الروابط التي لا تطابق ملفات ثابتة تُعاد توجيهها إلى `index.html`. المنصة لا تتعرف على المجلدات الفرعية في `public/` كملفات ثابتة بشكل صحيح.

## الحل المقترح

### الخيار 1: Edge Function (الأقوى والأشمل)

إنشاء Edge Function تتعرف على crawler requests وتُرجع HTML مخصص:

| الملف | الوظيفة |
|-------|---------|
| `supabase/functions/og-handler/index.ts` | Edge Function للـ Dynamic OG |

**آلية العمل:**
```text
Crawler Request → Edge Function → Custom HTML
User Request → Edge Function → Redirect to SPA
```

### الخيار 2: Static HTML Files بأسماء مباشرة

إنشاء ملفات HTML بأسماء مباشرة (بدون مجلدات):

| الملف الجديد | الوظيفة |
|--------------|---------|
| `public/from.html` | صفحة /from للـ crawlers |
| `public/launch.html` | صفحة /launch للـ crawlers |

**ملاحظة:** هذا قد لا يعمل أيضاً بسبب SPA routing.

---

## الحل الموصى به: Pre-rendering via Cloudflare Workers أو Edge Function

### الخطوات:

#### 1. إنشاء Edge Function: `og-handler`

```text
supabase/functions/og-handler/index.ts
├── استقبال الطلب
├── فحص User-Agent للتعرف على crawlers
├── إذا crawler → إرجاع HTML مع OG tags الصحيحة
├── إذا مستخدم عادي → redirect للموقع
└── دعم روابط: /from, /launch, /lp/*
```

#### 2. خريطة الصفحات

| الرابط | OG:title | OG:description |
|--------|----------|----------------|
| `/from` | تطبيق خلّى القسمة أوضح بيننا | استخدمته في الطلعات وراح يريحك من لخبطة الحساب |
| `/launch` | القسمة دايمًا تلخبط؟ خلّها واضحة | تطبيق بسيط يخلي القسمة بين الأصدقاء عادلة بدون إحراج ولا نقاش |

#### 3. منطق التعرف على Crawlers

```text
User-Agent patterns:
- WhatsApp → "WhatsApp"
- Telegram → "TelegramBot"  
- Facebook → "facebookexternalhit"
- Twitter → "Twitterbot"
- LinkedIn → "LinkedInBot"
- Slack → "Slackbot"
```

#### 4. الاستخدام (للإنفلونسرز)

بدلاً من مشاركة:
```text
diviso.app/from
```

يمكن مشاركة رابط Edge Function:
```text
diviso.app/api/og?path=/from&utm_source=NAME
```

**أو** (الأفضل) إعداد DNS/Cloudflare Worker لتوجيه crawlers تلقائياً.

---

## التنفيذ التقني

### الملفات الجديدة:

| الملف | الغرض |
|-------|-------|
| `supabase/functions/og-handler/index.ts` | Edge Function |

### السلوك:

```text
1. Crawler يطلب diviso.app/from
2. Edge Function تتعرف على crawler
3. ترجع HTML مع OG tags الصحيحة:
   - og:title = "تطبيق خلّى القسمة أوضح بيننا"
   - og:description = "استخدمته في الطلعات..."
   - og:image = "https://diviso.app/og-image.png"
4. WhatsApp يعرض البيانات الصحيحة في preview
```

### حذف الملفات غير الفعالة:

الملفات الحالية (`public/from/index.html` و `public/launch/index.html`) لا تعمل ويمكن حذفها أو الإبقاء عليها كـ fallback.

---

## ملاحظة مهمة

لكي تعمل Edge Function كـ "gateway" للـ OG tags، يجب أن يتم استدعاؤها قبل الوصول للموقع. هذا يتطلب:

1. **إما** تغيير روابط المشاركة إلى Edge Function URL
2. **أو** إعداد Cloudflare Worker/Rules لتوجيه crawler requests

الخيار الأول أبسط للتنفيذ الآن، والخيار الثاني يتطلب إعدادات DNS إضافية.



# خطة تحسين محتوى Use Cases للظهور في محركات البحث وأدوات الذكاء الاصطناعي

## الهدف
جعل Diviso يظهر في:
- Google / Bing / DuckDuckGo
- إجابات أدوات الذكاء الاصطناعي (ChatGPT, Perplexity, Copilot)
- كمرجع للسيناريوهات والحلول

---

## المرحلة 1: تحليل الوضع الحالي

### الصفحات الموجودة حالياً (5 صفحات):
| Slug | العنوان العربي | الهيكل |
|------|---------------|--------|
| `travel` | مصاريف السفر مع الأصدقاء | ✅ جيد |
| `shared-housing` | مصاريف السكن المشترك | ✅ جيد |
| `friends-expenses` | مصاريف الطلعات والمطاعم | ✅ جيد |
| `events` | تقسيم تكاليف الفعاليات | ✅ جيد |
| `group-trips` | رحلات المجموعات والكشتات | ✅ جيد |

### ما يحتاج تحسين:
1. **الإجابة المباشرة (AI Target)** - المقدمة الحالية جيدة لكن تحتاج تكون 40-60 كلمة بالضبط
2. **إضافة صفحة جديدة** - `awkward-money-situations` للسيناريوهات المحرجة
3. **تحسين Schema** - إضافة المزيد من structured data

---

## المرحلة 2: التغييرات المطلوبة

### 1. إضافة صفحة جديدة: `awkward-money-situations`

**الملف:** `src/content/use-cases/useCases.ts`

```text
slug: 'awkward-money-situations'
title: 'التعامل مع مواقف الفلوس المحرجة'
question: 'كيف تطلب فلوسك من صديقك بدون ما تخرب العلاقة؟'

الإجابة المباشرة (AI Target):
"Diviso يحل مشكلة طلب الفلوس من الأصدقاء عن طريق نظام تلقائي يُظهر
من يدين لمن بدون ما تحتاج تطلب بنفسك. كل شخص يشوف رصيده بوضوح،
والتسوية تصير بضغطة زر بدون إحراج أو خلافات."
```

### 2. تحسين بنية الإجابات (AI-First Structure)

**تحديث كل صفحة** لتتبع الهيكل:

```text
┌─────────────────────────────────────────┐
│  H1: سؤال واضح (Question)               │
├─────────────────────────────────────────┤
│  الإجابة المباشرة (40-60 كلمة)          │  ← AI يلتقط هذا
├─────────────────────────────────────────┤
│  المشكلة (bullet points)                │
├─────────────────────────────────────────┤
│  الحل مع Diviso (bullet points)         │
├─────────────────────────────────────────┤
│  خطوات الاستخدام (numbered)             │
├─────────────────────────────────────────┤
│  الأسئلة الشائعة (FAQ Schema)           │
└─────────────────────────────────────────┘
```

### 3. تحسين JSON-LD Schema

**الملف:** `src/pages/UseCaseDetails.tsx`

إضافة:
- `speakable` property للإجابة المباشرة
- تحسين `Article` schema بإضافة `datePublished` و `dateModified`
- إضافة `mentions` للـ entity recognition

---

## المرحلة 3: تحديث Sitemap

**الملف:** `public/sitemap.xml`

إضافة الصفحة الجديدة:
```xml
<url>
  <loc>https://diviso.app/use-cases/awkward-money-situations</loc>
  <xhtml:link rel="alternate" hreflang="ar" href="https://diviso.app/use-cases/awkward-money-situations" />
  <xhtml:link rel="alternate" hreflang="en" href="https://diviso.app/use-cases/awkward-money-situations?lang=en" />
  <lastmod>2026-01-26</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

---

## المرحلة 4: IndexNow Trigger

بعد النشر، استدعاء Edge Function لإرسال URLs للفهرسة:

```javascript
// URLs للإرسال
[
  '/use-cases',
  '/use-cases/travel',
  '/use-cases/shared-housing',
  '/use-cases/friends-expenses',
  '/use-cases/events',
  '/use-cases/group-trips',
  '/use-cases/awkward-money-situations'
]
```

---

## ملخص الملفات المطلوب تعديلها

| الملف | نوع التغيير |
|-------|-------------|
| `src/content/use-cases/useCases.ts` | إضافة صفحة جديدة + تحسين المقدمات |
| `src/pages/UseCaseDetails.tsx` | تحسين Schema + إضافة speakable |
| `src/components/use-cases/RelatedUseCases.tsx` | إضافة أيقونة جديدة |
| `public/sitemap.xml` | إضافة URL جديد |

---

## التفاصيل التقنية

### محتوى الصفحة الجديدة:

**H1:** كيف تطلب فلوسك من صديقك بدون ما تخرب العلاقة؟

**الإجابة المباشرة (56 كلمة):**
> Diviso يحل مشكلة طلب الفلوس من الأصدقاء عن طريق نظام تلقائي يُظهر من يدين لمن بدون ما تحتاج تطلب بنفسك. كل شخص يشوف رصيده بوضوح في التطبيق، والتسوية تصير بضغطة زر عن طريق Apple Pay أو التحويل البنكي بدون إحراج أو خلافات.

**المشاكل:**
- إحراج طلب الفلوس مباشرة
- نسيان المبالغ الصغيرة
- تأثير الديون على العلاقات
- عدم وجود إثبات للمصاريف

**الحلول:**
- التطبيق يُظهر الرصيد تلقائياً
- إشعارات ودية للتذكير
- سجل واضح لكل المصاريف
- تسوية سهلة وسريعة

**FAQs:**
1. هل يرسل التطبيق تذكير لصديقي؟
2. ماذا لو رفض صديقي الدفع؟
3. هل يمكن تقسيم المبلغ على دفعات؟

---

## النتائج المتوقعة

بعد التنفيذ:
- ✅ 6 صفحات Use Cases محسّنة للـ AI
- ✅ Structured data كامل (Article + FAQ + HowTo + SoftwareApplication)
- ✅ إجابات مباشرة قابلة للاقتباس من AI
- ✅ فهرسة فورية عبر IndexNow
- ✅ تغطية للسيناريوهات المحرجة (طلب عالي)

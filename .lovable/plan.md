
# خطة إصلاح Edge Function للدعوات

## المشكلة الحالية
الرابط المُشارك يستخدم عنوان الـ Edge Function:
```
https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/invite-preview?token=...
```

عند فتحه في المتصفح يظهر HTML خام بدلاً من صفحة مُعالجة.

**السبب:** الـ Edge Function يُرسل HTML لجميع الزوار بدون تمييز بين:
- **Crawlers** (واتساب، فيسبوك) ← يحتاجون HTML مع OG tags
- **المستخدمين** ← يحتاجون redirect للتطبيق

---

## الحل

### التعديل على `supabase/functions/invite-preview/index.ts`

إضافة منطق ذكي يفرق بين الزوار:

```text
┌─────────────────────────────────────────────────┐
│           طلب وارد للـ Edge Function            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │  فحص User-Agent  │
           └────────┬────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   Crawler?    │       │   مستخدم؟     │
│ (واتساب، فيسبوك)│       │ (Safari، Chrome)│
└───────┬───────┘       └───────┬───────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ أرسل HTML     │       │ 302 Redirect  │
│ مع OG tags    │       │ إلى التطبيق   │
└───────────────┘       └───────────────┘
```

### الكود المُحدَّث

**إضافة بعد سطر 88 (بعد تعريف inviteUrl):**

```typescript
// للمستخدمين العاديين: redirect مباشر للتطبيق
if (!isCrawler(userAgent)) {
  console.log(`User redirect to: ${inviteUrl}`);
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': inviteUrl,
    },
  });
}

// للـ crawlers: أرسل HTML مع OG tags
console.log(`Crawler detected: ${userAgent.substring(0, 50)}...`);
```

---

## النتيجة المتوقعة

### سيناريو 1: مشاركة عبر واتساب
```
1. واتساب يطلب الرابط → User-Agent: WhatsApp
2. Edge Function يُرجع HTML مع OG tags
3. واتساب يعرض المعاينة الجميلة ✓
```

### سيناريو 2: مستخدم يفتح الرابط
```
1. المستخدم ينقر الرابط → User-Agent: Safari/Chrome
2. Edge Function يُرجع 302 Redirect
3. المتصفح ينتقل لـ diviso.app/i/TOKEN ✓
4. التطبيق يعالج الانضمام للمجموعة ✓
```

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `supabase/functions/invite-preview/index.ts` | إضافة redirect للمستخدمين العاديين |

---

## ملاحظة
هذا الإصلاح يجعل حتى الروابط القديمة (Edge Function URLs) تعمل بشكل صحيح - سيتم تحويل المستخدم تلقائياً للتطبيق.

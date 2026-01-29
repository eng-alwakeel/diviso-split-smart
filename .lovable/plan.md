

# خطة تنفيذ WhatsApp Link Preview + Auto Text الشاملة

## الوضع الحالي

| الملف/المكون | الحالة | المشكلة |
|-------------|--------|---------|
| `invite-preview` Edge Function | موجود لكن غير مستخدم | `appUrl` خاطئ + يرجع JSON للمستخدم بدلاً من HTML |
| `referral-preview` | غير موجود | لا يوجد Edge Function للإحالات |
| `InviteLinkTab.tsx` | يستخدم displayLink فقط | النسخ/المشاركة ترسل رابط SPA = لا preview |
| `ReferralCenter.tsx` | يستخدم displayLink فقط | نفس المشكلة |
| `config.toml` | ناقص | لا يوجد تكوين لـ `invite-preview` |

---

## التغييرات المطلوبة

### 1. تحديث `supabase/functions/invite-preview/index.ts`

**التغييرات:**
- تغيير `appUrl` من `diviso-split-smart.lovable.app` إلى `https://diviso.app`
- تحديث النصوص حسب المواصفات:
  - `og:title`: `{inviterName} يدعوك للانضمام لمجموعة "{groupName}"`
  - `og:description`: `قسّموا مصاريف "{groupName}" بينكم بوضوح وبدون إحراج.\nانضم الآن 👇`
- إضافة `og:image:width` و `og:image:height`
- إزالة `<meta http-equiv="refresh">` 
- إرجاع HTML لكل المستخدمين (ليس JSON) مع زر CTA "انضم للمجموعة"
- تحسين تصميم صفحة الهبوط

### 2. إنشاء `supabase/functions/referral-preview/index.ts` (جديد)

**الوظيفة:**
- يستقبل `?code={referral_code}`
- يجلب بيانات صاحب الكود من `user_referral_codes` مع `profiles`
- يرجع HTML مع OG tags:
  - `og:title`: `تعال جرّب Diviso معي`
  - `og:description`: `نستخدمه عشان نقسّم المصاريف بسهولة وبدون مشاكل.\nسجّل من الرابط 👇`
- صفحة هبوط بسيطة مع زر "انضم الآن" → `diviso.app/join/{code}`

### 3. تحديث `supabase/config.toml`

إضافة:
```toml
[functions.invite-preview]
verify_jwt = false

[functions.referral-preview]
verify_jwt = false
```

### 4. تحديث `src/components/group/invite-tabs/InviteLinkTab.tsx`

**التغييرات:**
- إنشاء رابطين:
  - `displayLink` = `https://diviso.app/i/{token}` (للعرض)
  - `shareLink` = `https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/invite-preview?token={token}` (للنسخ/المشاركة)
- زر "نسخ" → ينسخ `shareLink` (افتراضي)
- زر "مشاركة" → `navigator.share({ url: shareLink })`
- إضافة زر ثانوي "نسخ الرابط القصير" (اختياري) → ينسخ `displayLink`

### 5. تحديث `src/pages/ReferralCenter.tsx`

**التغييرات:**
- إنشاء `shareLink` للإحالة = Edge Function URL
- `handleCopy()` → ينسخ `shareLink`
- `handleShare()` → `navigator.share({ url: shareLink })`

### 6. تحديث `src/hooks/useReferrals.ts`

**إضافة:**
```typescript
const getShareableLink = useCallback((code: string | null) => {
  if (!code) return null;
  return `https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/referral-preview?code=${code}`;
}, []);
```

### 7. تحديث `public/launch/index.html`

**تحديث النصوص حسب المواصفات:**
- `og:title`: `القسمة دايم تسبب لخبطة؟`
- `og:description`: `هذا تطبيق يخلي المصاريف واضحة بينكم من أولها.\nجرّبه الآن 👇`

### 8. تحديث `public/from/index.html`

**تحديث النصوص حسب المواصفات:**
- `og:title`: `قسّم بذكاء وسافر براحة`
- `og:description`: `رتّب المصاريف بينكم في أي رحلة أو طلعة بدون إحراج.\nجرّب Diviso 👇`

---

## قسم تقني

### Edge Function URLs

| نوع الرابط | Share Link (للنسخ/المشاركة) |
|-----------|----------------------------|
| دعوة مجموعة | `https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/invite-preview?token={token}` |
| إحالة شخصية | `https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/referral-preview?code={code}` |

### OG Tags المطلوبة

**لكل صفحة:**
```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Diviso">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://diviso.app/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="...">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://diviso.app/og-image.png">
```

### مخطط التدفق

```text
المستخدم يضغط "نسخ" أو "مشاركة"
              |
              v
+----------------------------+
| Share Link (Edge Function) |
+-------------+--------------+
              |
         +----+----+
         |         |
      Crawler    User
         |         |
         v         v
    HTML مع      صفحة هبوط
    OG tags      مع زر CTA
         |              |
         v              v
    WhatsApp        يضغط زر
    يظهر           "انضم"
    preview             |
                        v
                diviso.app/i/{token}
                (React يعالج الانضمام)
```

### Fallbacks

| الحالة | القيمة الافتراضية |
|--------|------------------|
| `inviterName` مفقود | `صديقك` |
| `groupName` مفقود | `مجموعة جديدة` |

---

## الملفات المطلوب تعديلها/إنشاؤها

| الملف | النوع | الوصف |
|-------|------|-------|
| `supabase/functions/invite-preview/index.ts` | تحديث | إصلاح appUrl + HTML لجميع المستخدمين + نصوص جديدة |
| `supabase/functions/referral-preview/index.ts` | **جديد** | Edge Function للإحالات |
| `supabase/config.toml` | تحديث | إضافة تكوين الـ Edge Functions |
| `src/components/group/invite-tabs/InviteLinkTab.tsx` | تحديث | استخدام shareLink للنسخ/المشاركة |
| `src/pages/ReferralCenter.tsx` | تحديث | استخدام shareLink للنسخ/المشاركة |
| `src/hooks/useReferrals.ts` | تحديث | إضافة `getShareableLink()` |
| `public/launch/index.html` | تحديث | نصوص OG جديدة |
| `public/from/index.html` | تحديث | نصوص OG جديدة |

---

## اختبارات القبول

بعد التنفيذ، عند لصق الروابط في واتساب:

| الرابط | Preview المتوقع |
|--------|----------------|
| `diviso.app/launch` | "القسمة دايم تسبب لخبطة؟" + صورة كبيرة |
| `diviso.app/from` | "قسّم بذكاء وسافر براحة" + صورة كبيرة |
| Share Link لـ `/i/{token}` | "{اسم} يدعوك للانضمام لمجموعة..." + صورة |
| Share Link لـ `/join/{code}` | "تعال جرّب Diviso معي" + صورة |

### Cache Testing
- استخدم `?v=timestamp` عند الاختبار
- أو [Facebook Debugger](https://developers.facebook.com/tools/debug/)


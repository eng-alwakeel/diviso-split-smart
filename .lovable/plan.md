
# خطة إصلاح مشكلة رابط الدعوة

## المشكلة المكتشفة
عند مشاركة رابط دعوة للمجموعة، يُرسل رابط الـ Edge Function:
```
https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/invite-preview?token=ABC
```

بدلاً من الرابط المباشر:
```
https://diviso.app/i/ABC
```

**النتيجة:** المستخدم يرى كود HTML خام (كما في الصورة) بدلاً من صفحة مُعالجة.

---

## الحل

### الاستراتيجية الجديدة
- استخدام رابط التطبيق المباشر `diviso.app/i/TOKEN` للمشاركة
- الاعتماد على `index.html` مع OG tags ثابتة للمعاينة الاجتماعية
- إزالة الاعتماد على Edge Function URL للمشاركة

### التغييرات المطلوبة

#### الملف: `src/components/group/invite-tabs/InviteLinkTab.tsx`

| السطر | قبل | بعد |
|-------|-----|-----|
| 78-83 | استخدام shareUrl مختلف عن displayUrl | استخدام displayUrl للمشاركة أيضاً |
| 117 | نسخ shareLink | نسخ displayLink |
| 139-156 | مشاركة shareLink | مشاركة displayLink |

**التغييرات بالتفصيل:**

```tsx
// السطر 78-83 - حذف shareUrl واستخدام displayUrl فقط
const displayUrl = `${BRAND_CONFIG.url}/i/${tokenData.token}`;
setDisplayLink(displayUrl);
setShareLink(displayUrl); // نفس الرابط للعرض والمشاركة
```

---

## النتيجة المتوقعة

### قبل
```
رابط المشاركة: https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/invite-preview?token=ABC

↓ عند الفتح
[صفحة HTML خام تظهر كنص] ❌
```

### بعد
```
رابط المشاركة: https://diviso.app/i/ABC

↓ عند الفتح
[انتقال مباشر للتطبيق وانضمام للمجموعة] ✓
```

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/components/group/invite-tabs/InviteLinkTab.tsx` | استخدام رابط diviso.app مباشرة للمشاركة |

---

## ملاحظة تقنية
المعاينة الاجتماعية (OG preview) لن تعمل بشكل ديناميكي (اسم المجموعة والمرسل) لكن الرابط سيعمل بشكل صحيح. يمكن تحسين المعاينة لاحقاً عبر إعداد proxy أو Cloudflare Worker.

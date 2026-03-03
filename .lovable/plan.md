

# إصلاح مشاركة التسويات — النص والصورة لا تظهر

## المشكلة

من الصور:
1. **زر المشاركة (Share2)**: يرسل فقط العنوان "التسويات المقترحة" بدون محتوى التسويات
2. **زر حفظ الصورة (ImageDown)**: الصورة لا تُولّد بشكل صحيح — `html2canvas` يفشل مع العناصر المخفية off-screen لأن CSS variables (مثل `bg-card`, `text-foreground`) لا تُحسب بشكل صحيح

## الحلول

### A) إصلاح زر المشاركة النصية

**الملف:** `src/components/group/AllMembersBalances.tsx`

المشكلة في السطر 224: `Share.share({ title, text })` — على iOS، الـ Capacitor Share يعرض العنوان فقط في واجهة المشاركة. الحل:
- دمج النص الكامل في حقل `text` مباشرة (بدون الاعتماد على `title`)
- إضافة رابط التطبيق في نهاية النص

### B) إصلاح تصدير الصورة

**الملف:** `src/components/group/AllMembersBalances.tsx`

المشكلة: `html2canvas` لا يلتقط CSS variables بشكل صحيح من عنصر off-screen. الحل:
1. إنشاء `SettlementShareCard` بأنماط مدمجة (inline styles) بدل CSS variables
2. أو الأفضل: تحديث `SettlementShareCard` ليدعم وضع "export" بألوان ثابتة (أبيض/أسود) بدل CSS variables
3. بعد التقاط الصورة: مشاركتها مباشرة عبر `Share.share({ files })` مع النص

### C) تحديث `SettlementShareCard.tsx`

**الملف:** `src/components/group/SettlementShareCard.tsx`

إضافة prop `exportMode` يستخدم ألوان ثابتة (خلفية بيضاء، نص أسود) بدل CSS variables — يضمن عمل `html2canvas` بشكل صحيح:
```
exportMode=true → bg-white, text-black, border-gray-200
exportMode=false → bg-card, text-foreground (الوضع العادي)
```

### D) دمج النص مع الصورة عند المشاركة

عند الضغط على زر المشاركة:
- مشاركة النص + الصورة معاً عبر `Share.share({ text, files })`
- على الويب: تنزيل الصورة + نسخ النص

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/components/group/AllMembersBalances.tsx` | إصلاح منطق المشاركة + تصدير الصورة |
| `src/components/group/SettlementShareCard.tsx` | إضافة `exportMode` بألوان ثابتة |


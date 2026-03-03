

# تحسين مشاركة/تصدير التسويات

## المشاكل الحالية
1. **زر الطباعة** يطبع الصفحة كاملة (`window.print()`) بدل تصدير كرت التسوية فقط كصورة/PDF
2. **رسالة المشاركة** تحتاج مراجعة للتنسيق

## التغييرات المطلوبة

### A) استبدال الطباعة بتصدير صورة

**الملف:** `src/components/group/AllMembersBalances.tsx`

- تثبيت `html2canvas` لتحويل كرت التسوية (`SettlementShareCard`) إلى صورة
- زر الطباعة يصبح "حفظ كصورة" (أيقونة `ImageDown` أو `Download`)
- عند الضغط:
  1. يعرض `SettlementShareCard` مؤقتاً (off-screen) بتنسيق جميل
  2. `html2canvas` يحوله لصورة PNG
  3. يفتح رابط تنزيل أو يشاركه عبر Share API

### B) مراجعة رسالة المشاركة

**الملف:** `src/components/group/SettlementShareCard.tsx`

الرسالة الحالية تعمل (كما في الصورة المرفوعة). تحسينات بسيطة:
- إضافة اسم العملة بشكل أوضح (مثلاً "ريال" بدل "SAR")
- التأكد من ترتيب RTL صحيح في النص المشارك
- إضافة رابط التطبيق في نهاية الرسالة

### C) تحسين تجربة التصدير

- جعل `SettlementShareCard` يظهر مؤقتاً بـ `position: fixed; left: -9999px` أثناء التقاط الصورة
- بعد التقاط الصورة: مشاركة عبر `Share.share({ files })` على Native أو تنزيل مباشر على الويب

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| `src/components/group/AllMembersBalances.tsx` | استبدال `window.print()` بـ html2canvas export |
| `src/components/group/SettlementShareCard.tsx` | تحسين رسالة المشاركة + إضافة رابط التطبيق |
| `package.json` | تثبيت `html2canvas` |


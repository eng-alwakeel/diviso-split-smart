

# إصلاح مشكلة اختيار العضو في نافذة الرصيد السابق

## المشكلة
القائمة المنسدلة (Select) داخل Dialog تستخدم Radix Portal — كلاهما بـ `z-index: 50`. عند فتح SelectContent داخل Dialog، يظهر خلف الـ Dialog أو لا يستجيب للنقر.

## الحل
إضافة `modal={false}` على الـ `Dialog` في `PreviousBalanceSheet.tsx` لمنع Radix من حبس الـ focus داخل الـ Dialog، مما يسمح لـ SelectContent بالعمل بشكل صحيح.

بالإضافة لذلك، رفع z-index لـ SelectContent داخل هذا المكون لضمان ظهوره فوق الـ Dialog.

## الملف المتأثر
- `src/components/group/PreviousBalanceSheet.tsx` — تعديل بسيط على Dialog و SelectContent


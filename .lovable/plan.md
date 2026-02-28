
السبب الجذري واضح الآن، والمشكلة فعلًا “عامة” لأنها تأتي من مكوّن مشترك يظهر في كل الصفحات المحمية.

## ما الذي يحدث بالضبط
- في `App.tsx` كل الصفحات المحمية تعرض `AppHeader`.
- داخل `AppHeader` يوجد `NotificationBell`.
- `NotificationBell` عند إشعار نوع `new_message` ينفّذ:
  - `payload.content.substring(...)`
- لكن دالة قاعدة البيانات الحالية `public.notify_new_message()` (المفعّلة حاليًا) تُنشئ payload بهذا الشكل:
  - `group_id`, `sender_id`, `message_preview`
  - **ولا تضع `content` ولا `sender_name` ولا `group_name`**
- لذلك عند وجود أي إشعار `new_message` قديم/جديد بهذا الشكل، يحصل `TypeError` أثناء الرندر، وتلتقطه `PageErrorBoundary` وتظهر رسالة:
  - "حدث خطأ في تحميل هذه الصفحة"
- لأن `AppHeader` مشترك، فتظهر المشكلة كأنها في “كل الصفحات”.

## خطة الإصلاح (تنفيذ على مرحلتين لضمان عدم تكرار المشكلة)

### المرحلة 1: Hotfix في الواجهة (منع الكراش فورًا)
تعديل `src/components/NotificationBell.tsx` بحيث يكون العرض متسامحًا مع نقص البيانات:
- في حالة `new_message`:
  - استخدام fallback آمن:
    - `const raw = payload?.content ?? payload?.message_preview ?? ''`
    - ثم قص النص بشكل آمن.
  - الاسم fallback:
    - `payload?.sender_name ?? 'مستخدم'`
- منع أي وصول مباشر غير آمن مثل `payload.content.substring` بدون تحقق.
- النتيجة: حتى لو وصل payload ناقص من قاعدة البيانات، لن يحدث crash.

### المرحلة 2: إصلاح مصدر البيانات في قاعدة البيانات (الحل الدائم)
Migration جديد لإعادة تعريف `public.notify_new_message()` ليُنتج payload متوافق مع الواجهة:
- إضافة:
  - `content` (preview من `NEW.content`)
  - `sender_name` (من profiles)
  - `group_name` (من groups)
- والإبقاء على `message_preview` للتوافق الخلفي (اختياري لكن مفضّل).

صيغة payload المستهدفة:
- `message_id`
- `group_id`
- `group_name`
- `sender_id`
- `sender_name`
- `content`
- `message_preview` (اختياري للتوافق)

### المرحلة 3: تنظيف البيانات المتضررة الموجودة مسبقًا
بما أن هناك إشعارات `new_message` قديمة ناقصة، سنضيف داخل نفس migration تحديث بيانات:
- `UPDATE notifications ... WHERE type='new_message' AND payload->>'content' IS NULL`
- تعبئة `content` من `message_preview` عند توفره.
- تعبئة `sender_name` و `group_name` عبر join حسب `sender_id` و `group_id`.
- هذا يمنع استمرار المشاكل للمستخدمين الذين لديهم إشعارات قديمة.

## الملفات/المكونات المتأثرة
- `src/components/NotificationBell.tsx` (واجهة)
- Migration SQL جديد في `supabase/migrations/...` يتضمن:
  - `CREATE OR REPLACE FUNCTION public.notify_new_message()`
  - `UPDATE` تصحيحي لإشعارات `new_message` الناقصة

## ترتيب التنفيذ
1) تعديل الواجهة (Hotfix)  
2) تعديل دالة DB  
3) تنظيف السجلات القديمة  
4) التحقق من النتيجة

## التحقق بعد التنفيذ
- التحقق اليدوي:
  - تسجيل دخول مستخدم متأثر (مثل العضو 103)
  - فتح `/dashboard`, `/my-expenses`, `/my-groups`
  - التأكد من اختفاء شاشة الخطأ في جميع الصفحات
- التحقق من البيانات:
  - فحص أن إشعارات `new_message` الجديدة تحتوي `content` و`sender_name` و`group_name`
- التحقق من السجلات:
  - عدم ظهور أخطاء JavaScript من نوع `substring of undefined`
  - عدم ظهور أخطاء Postgres مرتبطة بالإشعارات

## ملاحظات تقنية مختصرة
- المشكلة ليست من `get_balance_summary` أو `get_pending_amounts` هذه المرة.
- الخطأ الحالي مرتبط بتوافق “شكل payload” بين دالة قاعدة البيانات ومكوّن العرض.
- الاعتماد على fallback في الواجهة مهم حتى مع إصلاح الدالة، لتفادي أي regressions مستقبلية.

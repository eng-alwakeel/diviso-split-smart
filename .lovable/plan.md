

# المشكلة: دالة `complete_onboarding_task` القديمة تتجاهل المهام الجديدة

## السبب الجذري

يوجد **نسختين** من الدالة في قاعدة البيانات:

1. **القديمة** (migration `20251231`): `complete_onboarding_task(p_user_id UUID, p_task_name TEXT)` — تدعم فقط: profile, group, expense, invite, referral. تُرجع `invalid_task` لأي مهمة أخرى.
2. **الجديدة** (migration `20260313`): `complete_onboarding_task(p_task_name TEXT, p_user_id UUID)` — تدعم كل المهام الـ 8.

بما أن ترتيب المعاملات مختلف، PostgreSQL يعتبرهم **دالتين منفصلتين** (function overloading). عند الاستدعاء، قد يتم تنفيذ الدالة القديمة التي ترفض `close_group` و `dice` و `plan` و `install_app`.

لذلك المهام الـ 4 الأصلية (profile, group, invite, expense) اشتغلت، لكن الـ 4 الجديدة (install_app, close_group, dice, plan) ما اتحدثت.

## الحل

### Migration جديد يعمل:
1. **حذف** الدالة القديمة: `DROP FUNCTION IF EXISTS complete_onboarding_task(UUID, TEXT)`
2. **إعادة إنشاء** دالة واحدة شاملة بترتيب معاملات موحد `(p_user_id UUID, p_task_name TEXT)` تدعم كل المهام الـ 8
3. تحديث `tasks_completed` بعدّ كل الأعمدة الـ 9 (بما فيها referral)
4. تحديث `v_all_completed` ليشمل كل الأعمدة

### ملف واحد يتأثر:
- Migration SQL جديد


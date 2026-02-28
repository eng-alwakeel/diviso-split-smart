
# إصلاح أخطاء الدوال في قاعدة البيانات (مشكلة عامة عند المستخدمين)

## المشكلة
يوجد 3 أخطاء في دوال SQL تمنع عمل التطبيق بشكل صحيح لجميع المستخدمين:

### الخطأ 1: `function is_group_member(uuid) does not exist`
الدوال `get_balance_summary` و `get_pending_amounts` معرّفة بـ `SET search_path TO ''` (فارغ)، فعند استدعائها لـ `is_group_member()` لا تجدها لأنها في schema `public`.

### الخطأ 2: `column bt.status does not exist`
الدالة `check_budget_alerts` تستدعي `get_group_budget_tracking_v2` وتستخدم أعمدة غير موجودة في نتائجها:
- `bt.status` (الصحيح: يجب حسابه من `percentage_used`)
- `bt.budgeted_amount` (الصحيح: `allocated_amount`)
- `bt.spent_percentage` (الصحيح: `percentage_used`)

## خطة الإصلاح

### Migration واحد يعالج الثلاثة:

**1. إعادة إنشاء `get_balance_summary`:**
- تغيير `SET search_path TO ''` إلى `SET search_path TO 'public'`
- أو تأهيل الاستدعاء: `public.is_group_member(p_group_id)`

**2. إعادة إنشاء `get_pending_amounts`:**
- نفس الإصلاح: تصحيح `search_path`

**3. إعادة إنشاء `check_budget_alerts`:**
- تصحيح `search_path` من `''` إلى `'public'`
- تصحيح أسماء الأعمدة:
  - `bt.status` -> حساب الحالة من `bt.percentage_used` (warning > 80%, critical > 95%, exceeded > 100%)
  - `bt.budgeted_amount` -> `bt.allocated_amount`
  - `bt.spent_percentage` -> `bt.percentage_used`

## الملفات المتأثرة
- Migration SQL جديد فقط (لا تغيير في كود الفرونتند)

## التأثير المتوقع
- اختفاء جميع الأخطاء التي تظهر عند المستخدمين
- عمل صفحات المجموعة والأرصدة والميزانية بشكل صحيح

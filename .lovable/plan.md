

# إصلاح خطأ إغلاق المجموعة — null user_id في trigger

## المشكلة
عند إغلاق المجموعة (إنهاء الرحلة)، الـ trigger `increment_completed_activities` يحاول إدخال سجل في `user_reputation` لكل عضو — بما فيهم الأعضاء المعلقين (المدعوين بالهاتف) الذين `user_id = NULL`، مما يسبب:

```
null value in column "user_id" violates not-null constraint
```

حتى لو حذفت العضو الآن، المشكلة ستتكرر مع أي مجموعة فيها أعضاء معلقين.

## الحل
إضافة database migration يعدّل الـ function بإضافة شرط واحد:

```sql
WHERE gm.group_id = NEW.id AND gm.user_id IS NOT NULL
```

## الملف
- `supabase/migrations/` — migration جديد يحتوي `CREATE OR REPLACE FUNCTION public.increment_completed_activities()` مع الشرط المُصحَّح.

## التغيير (سطر واحد)
الـ WHERE clause الحالي:
```sql
WHERE gm.group_id = NEW.id
```
يصبح:
```sql
WHERE gm.group_id = NEW.id AND gm.user_id IS NOT NULL
```

هذا يتجاهل الأعضاء المعلقين ويمنع الخطأ نهائياً.



# خطة: تصحيح دالة عداد المستخدمين المؤسسين

## المشكلة الحالية

الدالة `get_founding_program_stats` تعد **جميع المستخدمين** في جدول `profiles`:

```sql
SELECT COUNT(*) INTO v_total FROM profiles;
```

هذا يعني أنه بعد تجاوز 1000 مستخدم، العداد سيظهر رقماً خاطئاً لأنه يحسب المستخدمين غير المؤسسين أيضاً.

---

## الحل المطلوب

تعديل الدالة لتعد فقط المستخدمين الذين لديهم `is_founding_user = true`:

```sql
SELECT COUNT(*) INTO v_founders_count 
FROM profiles 
WHERE is_founding_user = true;
```

---

## التغيير المطلوب

### تحديث دالة `get_founding_program_stats`

**من:**
```sql
SELECT COUNT(*) INTO v_total FROM profiles;
v_remaining := GREATEST(0, v_limit - v_total);
```

**إلى:**
```sql
SELECT COUNT(*) INTO v_founders_count 
FROM profiles 
WHERE is_founding_user = true;

v_remaining := GREATEST(0, v_limit - v_founders_count);
```

### الدالة الكاملة بعد التعديل:

```sql
CREATE OR REPLACE FUNCTION public.get_founding_program_stats()
RETURNS JSON AS $$
DECLARE
  v_founders_count INTEGER;
  v_limit INTEGER := 1000;
  v_remaining INTEGER;
  v_is_closed BOOLEAN;
BEGIN
  -- Count ONLY founding users (is_founding_user = true)
  SELECT COUNT(*) INTO v_founders_count 
  FROM profiles 
  WHERE is_founding_user = true;
  
  -- Calculate remaining spots
  v_remaining := GREATEST(0, v_limit - v_founders_count);
  v_is_closed := (v_remaining = 0);
  
  RETURN json_build_object(
    'total', v_founders_count,
    'remaining', v_remaining,
    'limit', v_limit,
    'isClosed', v_is_closed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## سيناريوهات الاختبار

| الحالة | المتوقع |
|--------|---------|
| 55 مؤسس | `remaining = 945` |
| 999 مؤسس | `remaining = 1` |
| 1000 مؤسس | `remaining = 0`, `isClosed = true` |
| 1001 مستخدم (1000 مؤسس + 1 عادي) | `remaining = 0` (يعد المؤسسين فقط) |

---

## ملخص التغييرات

| الملف | التعديل |
|-------|---------|
| `supabase/migrations/` | تحديث دالة `get_founding_program_stats` |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | العداد يعد فقط `is_founding_user = true` |
| 2 | `remaining = 1000 - founders_count` |
| 3 | لا يحسب المستخدمين العاديين بعد إغلاق البرنامج |
| 4 | يختفي عند `remaining = 0` |
| 5 | لا يمكن التلاعب به يدوياً |



# خطة: إصلاح عداد برنامج المستخدمين المؤسسين

## المشكلة

العداد يُظهر "متبقي 1000 من 1000" بدلاً من الرقم الحقيقي (945 متبقي من 55 مستخدم حالي).

## السبب الجذري

سياسات RLS على جدول `profiles` تتطلب تسجيل الدخول:
- `Profiles are viewable by owner` → `id = auth.uid()`
- جميع السياسات الأخرى تتطلب `auth.uid() IS NOT NULL`

عندما يزور مستخدم غير مسجّل الصفحة الرئيسية، استعلام `SELECT id FROM profiles` يُرجع `count = 0` لأنه لا يملك صلاحية الوصول.

الـ hook يستخدم القيمة الافتراضية 1000 عند عدم وجود بيانات.

## الحل

إنشاء RPC function باستخدام `SECURITY DEFINER` تُرجع عدد المستخدمين فقط (بدون بيانات حساسة).

---

## التغييرات المطلوبة

### 1. Database Migration

إنشاء function جديدة `get_founding_program_stats`:

```sql
CREATE OR REPLACE FUNCTION public.get_founding_program_stats()
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_limit INTEGER := 1000;
  v_remaining INTEGER;
  v_is_closed BOOLEAN;
BEGIN
  -- Get total count of users
  SELECT COUNT(*) INTO v_total FROM profiles;
  
  -- Calculate remaining spots
  v_remaining := GREATEST(0, v_limit - v_total);
  v_is_closed := (v_remaining = 0);
  
  RETURN json_build_object(
    'total', v_total,
    'remaining', v_remaining,
    'limit', v_limit,
    'isClosed', v_is_closed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO authenticated;
```

---

### 2. تحديث useFoundingProgram.ts

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FoundingProgramStats {
  total: number;
  remaining: number;
  limit: number;
  isClosed: boolean;
  isLoading: boolean;
}

const FOUNDING_USERS_LIMIT = 1000;

export function useFoundingProgram(): FoundingProgramStats {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-program-stats'],
    queryFn: async () => {
      // Use RPC function that bypasses RLS
      const { data, error } = await supabase
        .rpc('get_founding_program_stats');
      
      if (error) {
        console.error('Error fetching founding program stats:', error);
        return { 
          total: 0, 
          remaining: FOUNDING_USERS_LIMIT, 
          limit: FOUNDING_USERS_LIMIT, 
          isClosed: false 
        };
      }
      
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  return {
    total: data?.total ?? 0,
    remaining: data?.remaining ?? FOUNDING_USERS_LIMIT,
    limit: data?.limit ?? FOUNDING_USERS_LIMIT,
    isClosed: data?.isClosed ?? false,
    isLoading
  };
}
```

---

## ملخص الملفات

| الملف | التعديل |
|-------|---------|
| `supabase/migrations/` | إضافة `get_founding_program_stats` function |
| `src/hooks/useFoundingProgram.ts` | استخدام RPC بدل SELECT مباشر |

---

## النتيجة المتوقعة

| قبل | بعد |
|-----|-----|
| متبقي 1000 من 1000 | متبقي 945 من 1000 |

---

## معايير القبول

| # | المعيار |
|---|---------|
| 1 | العداد يُظهر الرقم الصحيح للمستخدم غير المسجّل |
| 2 | العداد يُظهر الرقم الصحيح للمستخدم المسجّل |
| 3 | لا يكشف بيانات حساسة (فقط العدد) |
| 4 | يعمل على الصفحة الرئيسية وصفحة التسجيل |


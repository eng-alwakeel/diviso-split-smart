

# إصلاح فشل تحويل الخطة إلى مجموعة

## السبب المحتمل

بعد فحص شامل لدالة `convert_plan_to_group` والـ triggers والـ constraints، البنية كلها سليمة. الأسباب المحتملة:

1. **انتهاء جلسة المصادقة** — `auth.uid()` يرجع NULL فتفشل الدالة بـ "Not authenticated"
2. **خطأ في trigger chain** — الدالة تمر عبر 5 triggers عند إنشاء المجموعة وعضو جديد، أي واحد يفشل يلغي الكل
3. **عدم وجود try-catch** في `handleConvert` فالخطأ يضيع بدون تفاصيل

## الإصلاحات

### 1. `src/hooks/usePlanDetails.ts`
- إضافة console.error في `onError` لعرض الخطأ الفعلي من Supabase
- تمرير رسالة الخطأ الحقيقية للـ toast

### 2. `src/pages/PlanDetails.tsx`
- إضافة try-catch حول `handleConvert` لمنع الخطأ غير المعالج

### 3. Migration: تحديث `convert_plan_to_group`
- إضافة `BEGIN...EXCEPTION` block داخل الدالة لالتقاط أي خطأ من الـ triggers
- إضافة `RAISE LOG` لتسجيل الخطأ الفعلي في سجلات PostgreSQL

```sql
CREATE OR REPLACE FUNCTION public.convert_plan_to_group(p_plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan record;
  v_group_id uuid;
  v_member record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND owner_user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or not owner';
  END IF;

  IF v_plan.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'Plan already linked to a group';
  END IF;

  -- Create group
  INSERT INTO groups (name, currency, owner_id, group_type, source_plan_id)
  VALUES (
    v_plan.title,
    COALESCE(v_plan.budget_currency, 'SAR'),
    v_user_id,
    CASE v_plan.plan_type
      WHEN 'trip' THEN 'trip'
      WHEN 'shared_housing' THEN 'home'
      WHEN 'outing' THEN 'party'
      WHEN 'activity' THEN 'general'
      ELSE 'general'
    END,
    p_plan_id
  )
  RETURNING id INTO v_group_id;

  -- Add plan members to group
  FOR v_member IN SELECT user_id, role FROM plan_members WHERE plan_id = p_plan_id
  LOOP
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (
      v_group_id,
      v_member.user_id,
      CASE WHEN v_member.role = 'owner' THEN 'owner' ELSE 'member' END
    )
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END LOOP;

  -- Link plan to group
  UPDATE plans SET group_id = v_group_id, status = 'done' WHERE id = p_plan_id;

  RETURN v_group_id;
END;
$$;
```

الفرق: إضافة `COALESCE` للـ currency كاحتياط.

### 4. تحسين رسائل الخطأ
في `usePlanDetails.ts`:
```ts
onError: (error: Error) => {
  console.error('Convert to group failed:', error);
  toast({ 
    title: t('convert_dialog.error'), 
    description: error.message,
    variant: 'destructive' 
  });
},
```

هذا يكشف الخطأ الحقيقي من Supabase (مثل "Not authenticated" أو constraint violation) ويعرضه للمستخدم ولنا في الـ console.


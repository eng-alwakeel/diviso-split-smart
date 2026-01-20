-- Trigger لتحديث مهمة الدعوة عند انضمام عضو جديد للمجموعة
CREATE OR REPLACE FUNCTION public.update_invite_task_on_member_join()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- الحصول على صاحب المجموعة
  SELECT owner_id INTO v_owner_id 
  FROM public.groups 
  WHERE id = NEW.group_id;
  
  -- تحديث مهمة الدعوة لصاحب المجموعة (فقط إذا كان العضو الجديد ليس هو المالك)
  IF v_owner_id IS NOT NULL AND NEW.user_id != v_owner_id THEN
    UPDATE public.onboarding_tasks 
    SET first_invite_sent = true,
        tasks_completed = CASE 
          WHEN first_invite_sent = false THEN tasks_completed + 1 
          ELSE tasks_completed 
        END,
        updated_at = now()
    WHERE user_id = v_owner_id AND first_invite_sent = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- حذف الـ trigger إذا كان موجوداً
DROP TRIGGER IF EXISTS on_member_join_update_invite_task ON public.group_members;

-- إنشاء الـ trigger
CREATE TRIGGER on_member_join_update_invite_task
AFTER INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.update_invite_task_on_member_join();

-- إصلاح البيانات الحالية للمستخدم الذي انضمت فاتن لمجموعته
UPDATE public.onboarding_tasks 
SET first_invite_sent = true,
    tasks_completed = CASE 
      WHEN first_invite_sent = false THEN tasks_completed + 1 
      ELSE tasks_completed 
    END,
    updated_at = now()
WHERE user_id = 'ab24ff88-62a9-4df7-8a8c-0dbd9b7a531b'
  AND first_invite_sent = false;
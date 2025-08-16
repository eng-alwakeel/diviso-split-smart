-- Function to notify group members about new expenses
CREATE OR REPLACE FUNCTION public.notify_expense_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_member_id uuid;
  v_group_name text;
  v_creator_name text;
BEGIN
  -- Get group name
  SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Get creator name
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_creator_name 
  FROM public.profiles WHERE id = NEW.created_by;
  
  -- Notify all group members except the creator
  FOR v_member_id IN 
    SELECT gm.user_id 
    FROM public.group_members gm 
    WHERE gm.group_id = NEW.group_id 
    AND gm.user_id != NEW.created_by
  LOOP
    PERFORM public.create_notification(
      v_member_id,
      'expense_created',
      jsonb_build_object(
        'expense_id', NEW.id,
        'group_id', NEW.group_id,
        'group_name', v_group_name,
        'creator_name', v_creator_name,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'description', COALESCE(NEW.description, NEW.note_ar, 'مصروف جديد')
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$
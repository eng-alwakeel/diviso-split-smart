-- Function to notify about expense approval/rejection
CREATE OR REPLACE FUNCTION public.notify_expense_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_group_name text;
  v_approver_name text;
BEGIN
  -- Only notify on status changes to approved or rejected
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Get group name
    SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id;
    
    -- Get approver name (assuming current user is the approver)
    SELECT COALESCE(display_name, name, 'مدير') INTO v_approver_name 
    FROM public.profiles WHERE id = auth.uid();
    
    -- Notify the expense creator
    PERFORM public.create_notification(
      NEW.created_by,
      CASE WHEN NEW.status = 'approved' THEN 'expense_approved' ELSE 'expense_rejected' END,
      jsonb_build_object(
        'expense_id', NEW.id,
        'group_id', NEW.group_id,
        'group_name', v_group_name,
        'approver_name', v_approver_name,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'description', COALESCE(NEW.description, NEW.note_ar, 'مصروف'),
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$
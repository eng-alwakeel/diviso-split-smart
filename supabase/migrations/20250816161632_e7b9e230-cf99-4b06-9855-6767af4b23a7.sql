-- Create helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (p_user_id, p_type, p_payload)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$function$

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

-- Function to notify about new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_member_id uuid;
  v_group_name text;
  v_sender_name text;
BEGIN
  -- Get group name
  SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Get sender name
  SELECT COALESCE(display_name, name, 'مستخدم') INTO v_sender_name 
  FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Notify all group members except the sender
  FOR v_member_id IN 
    SELECT gm.user_id 
    FROM public.group_members gm 
    WHERE gm.group_id = NEW.group_id 
    AND gm.user_id != NEW.sender_id
  LOOP
    PERFORM public.create_notification(
      v_member_id,
      'new_message',
      jsonb_build_object(
        'message_id', NEW.id,
        'group_id', NEW.group_id,
        'group_name', v_group_name,
        'sender_name', v_sender_name,
        'content', LEFT(NEW.content, 100) -- Preview of message
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$

-- Create triggers
CREATE TRIGGER trg_notify_expense_created
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_expense_created();

CREATE TRIGGER trg_notify_expense_status_change
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_expense_status_change();

CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
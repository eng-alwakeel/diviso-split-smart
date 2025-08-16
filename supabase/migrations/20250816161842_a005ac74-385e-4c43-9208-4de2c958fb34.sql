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
        'content', LEFT(NEW.content, 100)
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;
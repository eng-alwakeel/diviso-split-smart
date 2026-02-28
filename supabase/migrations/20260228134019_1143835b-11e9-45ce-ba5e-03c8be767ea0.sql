-- Fix notify_new_message to include content, sender_name, group_name
CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_name text;
  v_group_name text;
BEGIN
  SELECT COALESCE(p.display_name, p.name, 'مستخدم') INTO v_sender_name
  FROM public.profiles p WHERE p.id = NEW.sender_id;

  SELECT g.name INTO v_group_name
  FROM public.groups g WHERE g.id = NEW.group_id;

  INSERT INTO public.notifications (user_id, type, payload)
  SELECT 
    gm.user_id,
    'new_message',
    jsonb_build_object(
      'group_id', NEW.group_id,
      'group_name', COALESCE(v_group_name, ''),
      'sender_id', NEW.sender_id,
      'sender_name', COALESCE(v_sender_name, 'مستخدم'),
      'content', LEFT(NEW.content, 100),
      'message_preview', LEFT(NEW.content, 100)
    )
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
  AND gm.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$function$;

-- Clean up old new_message notifications missing content field
UPDATE public.notifications
SET payload = payload 
  || jsonb_build_object('content', COALESCE(payload->>'message_preview', ''))
  || jsonb_build_object('sender_name', COALESCE(
      (SELECT COALESCE(p.display_name, p.name, 'مستخدم') FROM public.profiles p WHERE p.id = (payload->>'sender_id')::uuid),
      'مستخدم'
    ))
  || jsonb_build_object('group_name', COALESCE(
      (SELECT g.name FROM public.groups g WHERE g.id = (payload->>'group_id')::uuid),
      ''
    ))
WHERE type = 'new_message'
AND (payload->>'content' IS NULL OR payload->>'sender_name' IS NULL);
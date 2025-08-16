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
$function$;
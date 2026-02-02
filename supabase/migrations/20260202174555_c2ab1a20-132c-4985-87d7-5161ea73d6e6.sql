-- إصلاح نوع الإرجاع للدالة create_group_join_token
DROP FUNCTION IF EXISTS public.create_group_join_token(uuid, member_role, text);

CREATE OR REPLACE FUNCTION public.create_group_join_token(
  p_group_id uuid, 
  p_role member_role DEFAULT 'member'::member_role, 
  p_link_type text DEFAULT 'general'::text
)
RETURNS TABLE(token uuid, expires_at timestamp with time zone, max_uses integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max_uses integer;
  v_token_record record;
BEGIN
  -- التحقق من صلاحية المستخدم
  IF NOT public.is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  -- دعوات غير محدودة
  v_max_uses := -1;

  -- إنشاء الرابط
  INSERT INTO public.group_join_tokens (
    group_id, role, created_by, max_uses, current_uses, link_type, expires_at
  ) VALUES (
    p_group_id, p_role, auth.uid(), v_max_uses, 0, p_link_type, now() + '1 day'::interval
  )
  RETURNING * INTO v_token_record;

  RETURN QUERY SELECT v_token_record.token, v_token_record.expires_at, v_token_record.max_uses;
END;
$function$;
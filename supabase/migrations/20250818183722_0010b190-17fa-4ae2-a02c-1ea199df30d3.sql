-- إضافة أعمدة جديدة لجدول group_join_tokens لدعم الاستخدام المتعدد
ALTER TABLE public.group_join_tokens 
ADD COLUMN max_uses integer DEFAULT -1,  -- -1 = غير محدود، رقم موجب = محدود
ADD COLUMN current_uses integer DEFAULT 0,
ADD COLUMN link_type text DEFAULT 'general';

-- تحديث مدة الصلاحية الافتراضية إلى 24 ساعة بدلاً من 3 أيام
ALTER TABLE public.group_join_tokens 
ALTER COLUMN expires_at SET DEFAULT (now() + '1 day'::interval);

-- تحديث دالة الانضمام للمجموعة لدعم الاستخدام المتعدد
CREATE OR REPLACE FUNCTION public.join_group_with_token(p_token uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token record;
  v_user_plan text;
begin
  if auth.uid() is null then
    raise exception 'auth_required' using errcode='28000';
  end if;

  select *
  into v_token
  from public.group_join_tokens t
  where t.token = p_token
    and t.expires_at > now()
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_token' using errcode='22023';
  end if;

  -- التحقق من أن المستخدم ليس عضواً مسبقاً في المجموعة
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = v_token.group_id and gm.user_id = auth.uid()
  ) then
    return v_token.group_id;
  end if;

  -- التحقق من حد الاستخدام إذا كان محدوداً
  if v_token.max_uses > 0 and v_token.current_uses >= v_token.max_uses then
    raise exception 'link_usage_exceeded' using errcode='22023';
  end if;

  -- إضافة المستخدم كعضو جديد
  insert into public.group_members (group_id, user_id, role)
  values (v_token.group_id, auth.uid(), v_token.role);

  -- تحديث عداد الاستخدام
  update public.group_join_tokens
  set current_uses = current_uses + 1
  where id = v_token.id;

  return v_token.group_id;
end;
$function$;

-- دالة لإنشاء رابط انضمام جديد مع تحديد العدد المسموح حسب الباقة
CREATE OR REPLACE FUNCTION public.create_group_join_token(
  p_group_id uuid,
  p_role member_role DEFAULT 'member',
  p_link_type text DEFAULT 'general'
)
RETURNS TABLE(token uuid, expires_at timestamp with time zone, max_uses integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_plan text;
  v_max_uses integer;
  v_token_record record;
BEGIN
  -- التحقق من صلاحية المستخدم لإنشاء رابط
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  -- الحصول على خطة المستخدم
  v_user_plan := public.get_user_plan(auth.uid());
  
  -- تحديد العدد المسموح حسب الباقة
  CASE v_user_plan
    WHEN 'free' THEN v_max_uses := 4;
    WHEN 'personal' THEN v_max_uses := -1; -- غير محدود
    WHEN 'family' THEN v_max_uses := -1; -- غير محدود
    WHEN 'lifetime' THEN v_max_uses := -1; -- غير محدود
    ELSE v_max_uses := 4; -- افتراضي للباقة المجانية
  END CASE;

  -- إنشاء الرابط الجديد
  INSERT INTO public.group_join_tokens (
    group_id, 
    role, 
    created_by, 
    max_uses, 
    current_uses,
    link_type,
    expires_at
  ) VALUES (
    p_group_id,
    p_role,
    auth.uid(),
    v_max_uses,
    0,
    p_link_type,
    now() + '1 day'::interval
  )
  RETURNING * INTO v_token_record;

  RETURN QUERY SELECT v_token_record.token, v_token_record.expires_at, v_token_record.max_uses;
END;
$function$;
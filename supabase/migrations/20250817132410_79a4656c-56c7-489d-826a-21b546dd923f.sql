-- إضافة عمود الأرشفة للإشعارات
ALTER TABLE public.notifications 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إضافة عمود الأرشفة للمجموعات  
ALTER TABLE public.groups
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إضافة فهرس للأداء
CREATE INDEX idx_notifications_archived_at ON public.notifications(archived_at);
CREATE INDEX idx_groups_archived_at ON public.groups(archived_at);

-- إضافة فهرس مركب للإشعارات النشطة
CREATE INDEX idx_notifications_active ON public.notifications(user_id, created_at) WHERE archived_at IS NULL;

-- إضافة فهرس مركب للمجموعات النشطة  
CREATE INDEX idx_groups_active ON public.groups(owner_id, created_at) WHERE archived_at IS NULL;

-- دالة لأرشفة الإشعارات القديمة المقروءة
CREATE OR REPLACE FUNCTION public.archive_old_notifications(p_user_id UUID, p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications 
  SET archived_at = now()
  WHERE user_id = p_user_id 
    AND read_at IS NOT NULL
    AND read_at <= now() - (p_days_old || ' days')::interval
    AND archived_at IS NULL;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- دالة للتنظيف التلقائي للإشعارات المؤرشفة القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_archived_notifications(p_months_old INTEGER DEFAULT 3)
RETURNS INTEGER  
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.notifications 
  WHERE archived_at IS NOT NULL
    AND archived_at <= now() - (p_months_old || ' months')::interval;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- دالة لأرشفة مجموعة
CREATE OR REPLACE FUNCTION public.archive_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;
  
  UPDATE public.groups 
  SET archived_at = now()
  WHERE id = p_group_id;
  
  RETURN true;
END;
$function$;

-- دالة لاستعادة مجموعة من الأرشيف
CREATE OR REPLACE FUNCTION public.unarchive_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;
  
  UPDATE public.groups 
  SET archived_at = NULL
  WHERE id = p_group_id;
  
  RETURN true;
END;
$function$;
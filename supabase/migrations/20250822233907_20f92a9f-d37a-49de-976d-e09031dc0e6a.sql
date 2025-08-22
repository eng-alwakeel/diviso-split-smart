-- إصلاح جميع الـ functions المتبقية التي تحتاج search_path

CREATE OR REPLACE FUNCTION public.get_admin_activity_stats()
RETURNS TABLE(date date, new_users bigint, active_users bigint, new_groups bigint, new_expenses bigint, ocr_usage bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as date
  )
  SELECT 
    ds.date,
    COALESCE(COUNT(DISTINCT p.id), 0) as new_users,
    COALESCE(COUNT(DISTINCT e.created_by), 0) as active_users,
    COALESCE(COUNT(DISTINCT g.id), 0) as new_groups,
    COALESCE(COUNT(DISTINCT e.id), 0) as new_expenses,
    COALESCE(COUNT(DISTINCT r.id), 0) as ocr_usage
  FROM date_series ds
  LEFT JOIN public.profiles p ON ds.date = p.created_at::date
  LEFT JOIN public.expenses e ON ds.date = e.created_at::date
  LEFT JOIN public.groups g ON ds.date = g.created_at::date
  LEFT JOIN public.receipt_ocr r ON ds.date = r.created_at::date
  GROUP BY ds.date
  ORDER BY ds.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_group_join_token(p_group_id uuid, p_role member_role DEFAULT 'member'::member_role, p_link_type text DEFAULT 'general'::text)
RETURNS TABLE(token uuid, expires_at timestamp with time zone, max_uses integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (p_user_id, p_type, p_payload)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_expense_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_user_admin(p_user_id uuid, p_is_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  UPDATE public.profiles 
  SET 
    is_admin = p_is_admin,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_budget_alerts(p_group_id uuid)
RETURNS TABLE(category_id uuid, category_name text, alert_type text, budgeted_amount numeric, spent_amount numeric, spent_percentage numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- التحقق من عضوية المستخدم في المجموعة
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  SELECT 
    bt.category_id,
    bt.category_name,
    bt.status as alert_type,
    bt.budgeted_amount,
    bt.spent_amount,
    bt.spent_percentage
  FROM public.get_group_budget_tracking_v2(p_group_id) bt
  WHERE bt.status IN ('warning', 'critical', 'exceeded')
    AND bt.budgeted_amount > 0
  ORDER BY 
    CASE bt.status 
      WHEN 'exceeded' THEN 1
      WHEN 'critical' THEN 2 
      WHEN 'warning' THEN 3
      ELSE 4
    END,
    bt.spent_percentage DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_expense_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_group(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE='28000';
  END IF;

  DELETE FROM public.expense_splits WHERE expense_id IN (
    SELECT id FROM public.expenses WHERE group_id = p_group_id
  );
  
  DELETE FROM public.expenses WHERE group_id = p_group_id;
  DELETE FROM public.settlements WHERE group_id = p_group_id;
  DELETE FROM public.group_members WHERE group_id = p_group_id;
  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_budget_tracking_v2(p_group_id uuid)
RETURNS TABLE(budget_id uuid, budget_name text, category_id uuid, category_name text, budgeted_amount numeric, spent_amount numeric, remaining_amount numeric, spent_percentage numeric, status text, expense_count integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- التحقق من عضوية المستخدم في المجموعة بشكل محسن
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id as budget_id,
    b.name as budget_name,
    bc.category_id,
    c.name_ar as category_name,
    bc.allocated_amount as budgeted_amount,
    COALESCE(spent.total_spent, 0) as spent_amount,
    bc.allocated_amount - COALESCE(spent.total_spent, 0) as remaining_amount,
    CASE 
      WHEN bc.allocated_amount > 0 
      THEN (COALESCE(spent.total_spent, 0) / bc.allocated_amount * 100)
      ELSE 0 
    END as spent_percentage,
    CASE 
      WHEN bc.allocated_amount = 0 THEN 'no_budget'
      WHEN COALESCE(spent.total_spent, 0) > bc.allocated_amount THEN 'exceeded'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.9 THEN 'critical'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.8 THEN 'warning'
      ELSE 'safe'
    END as status,
    COALESCE(spent.expense_count, 0)::integer as expense_count
  FROM budgets b
  JOIN budget_categories bc ON bc.budget_id = b.id
  LEFT JOIN categories c ON c.id = bc.category_id
  LEFT JOIN (
    SELECT 
      e.category_id,
      SUM(e.amount) as total_spent,
      COUNT(e.id) as expense_count
    FROM expenses e
    WHERE e.group_id = p_group_id 
    AND e.status = 'approved'
    GROUP BY e.category_id
  ) spent ON spent.category_id = bc.category_id
  WHERE b.group_id = p_group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  ORDER BY spent_percentage DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_link_expense_to_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- ربط المصروف بأول فئة ميزانية مطابقة ونشطة
  INSERT INTO expense_budget_links (expense_id, budget_category_id)
  SELECT 
    NEW.id,
    bc.id
  FROM budget_categories bc
  JOIN budgets b ON b.id = bc.budget_id
  WHERE bc.category_id = NEW.category_id
  AND b.group_id = NEW.group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  LIMIT 1
  ON CONFLICT (expense_id, budget_category_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_receiver_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.received_by IS NULL THEN
    NEW.received_by := NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$;
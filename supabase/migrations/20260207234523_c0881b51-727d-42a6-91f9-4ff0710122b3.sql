
-- =============================================
-- Outstanding Balance Notification (MVP)
-- =============================================

-- 1. Create balance_notifications table
CREATE TABLE public.balance_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_due numeric NOT NULL,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'marked_as_paid')),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_expense UNIQUE (user_id, expense_id)
);

-- 2. Enable RLS
ALTER TABLE public.balance_notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies - user can only see and update their own
CREATE POLICY "Users can view their own balance notifications"
  ON public.balance_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance notifications"
  ON public.balance_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for sending notifications)
CREATE POLICY "Authenticated users can insert balance notifications"
  ON public.balance_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Indexes
CREATE INDEX idx_balance_notifications_user_id ON public.balance_notifications(user_id);
CREATE INDEX idx_balance_notifications_expense_id ON public.balance_notifications(expense_id);
CREATE INDEX idx_balance_notifications_status ON public.balance_notifications(status);

-- 5. Updated_at trigger
CREATE TRIGGER update_balance_notifications_updated_at
  BEFORE UPDATE ON public.balance_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RPC: mark_balance_as_paid
CREATE OR REPLACE FUNCTION public.mark_balance_as_paid(p_balance_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the balance notification and verify ownership
  SELECT bn.notification_id, bn.user_id
  INTO v_notification_id, v_user_id
  FROM balance_notifications bn
  WHERE bn.id = p_balance_notification_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Balance notification not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update status
  UPDATE balance_notifications
  SET status = 'marked_as_paid', updated_at = now()
  WHERE id = p_balance_notification_id;

  -- Archive the related notification
  IF v_notification_id IS NOT NULL THEN
    UPDATE notifications
    SET archived_at = now()
    WHERE id = v_notification_id;
  END IF;

  RETURN true;
END;
$$;

-- 7. RPC: get_balance_notification_details
CREATE OR REPLACE FUNCTION public.get_balance_notification_details(p_balance_notification_id uuid)
RETURNS TABLE (
  id uuid,
  amount_due numeric,
  currency text,
  status text,
  expense_description text,
  expense_amount numeric,
  expense_date timestamptz,
  group_name text,
  group_id uuid,
  payer_name text,
  payer_avatar_url text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bn.id,
    bn.amount_due,
    bn.currency,
    bn.status,
    e.description AS expense_description,
    e.amount AS expense_amount,
    e.created_at AS expense_date,
    g.name AS group_name,
    bn.group_id,
    COALESCE(p.display_name, p.name, 'مستخدم') AS payer_name,
    p.avatar_url AS payer_avatar_url,
    bn.created_at
  FROM balance_notifications bn
  JOIN expenses e ON e.id = bn.expense_id
  JOIN groups g ON g.id = bn.group_id
  JOIN profiles p ON p.id = bn.payer_id
  WHERE bn.id = p_balance_notification_id
    AND bn.user_id = auth.uid();
END;
$$;

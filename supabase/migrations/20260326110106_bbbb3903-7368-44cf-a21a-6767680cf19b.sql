
-- Add expires_at column to settlements
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Set default for new rows
ALTER TABLE public.settlements
ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');

-- Update existing pending settlements
UPDATE public.settlements
SET expires_at = created_at + interval '7 days'
WHERE status = 'pending' AND expires_at IS NULL;

-- Auto-confirm function
CREATE OR REPLACE FUNCTION public.auto_confirm_expired_settlements()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.settlements
  SET status = 'confirmed', confirmed_at = now()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at <= now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Update get_group_balance to count expired pending settlements as confirmed
CREATE OR REPLACE FUNCTION public.get_group_balance(p_group_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  phone text,
  avatar_url text,
  amount_paid numeric,
  amount_owed numeric,
  settlements_in numeric,
  settlements_out numeric,
  net_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH members AS (
    SELECT gm.user_id, p.display_name, p.phone, p.avatar_url
    FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
  ),
  paid AS (
    SELECT e.payer_id AS user_id, COALESCE(SUM(e.amount), 0) AS amount_paid
    FROM public.expenses e
    WHERE e.group_id = p_group_id
      AND e.status = 'approved'
    GROUP BY e.payer_id
  ),
  owed AS (
    SELECT es.member_id AS user_id, COALESCE(SUM(es.share_amount), 0) AS amount_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
      AND e.status = 'approved'
    GROUP BY es.member_id
  ),
  sin AS (
    SELECT s.to_user_id AS user_id, COALESCE(SUM(s.amount), 0) AS settlements_in
    FROM public.settlements s
    WHERE s.group_id = p_group_id
      AND (s.status = 'confirmed' OR (s.status = 'pending' AND s.expires_at IS NOT NULL AND s.expires_at <= now()))
    GROUP BY s.to_user_id
  ),
  sout AS (
    SELECT s.from_user_id AS user_id, COALESCE(SUM(s.amount), 0) AS settlements_out
    FROM public.settlements s
    WHERE s.group_id = p_group_id
      AND (s.status = 'confirmed' OR (s.status = 'pending' AND s.expires_at IS NOT NULL AND s.expires_at <= now()))
    GROUP BY s.from_user_id
  )
  SELECT
    m.user_id,
    m.display_name,
    m.phone,
    m.avatar_url,
    COALESCE(p.amount_paid, 0) AS amount_paid,
    COALESCE(o.amount_owed, 0) AS amount_owed,
    COALESCE(si.settlements_in, 0) AS settlements_in,
    COALESCE(so.settlements_out, 0) AS settlements_out,
    (COALESCE(p.amount_paid, 0) - COALESCE(o.amount_owed, 0) + COALESCE(so.settlements_out, 0) - COALESCE(si.settlements_in, 0)) AS net_balance
  FROM members m
  LEFT JOIN paid p ON p.user_id = m.user_id
  LEFT JOIN owed o ON o.user_id = m.user_id
  LEFT JOIN sin si ON si.user_id = m.user_id
  LEFT JOIN sout so ON so.user_id = m.user_id;
END;
$$;

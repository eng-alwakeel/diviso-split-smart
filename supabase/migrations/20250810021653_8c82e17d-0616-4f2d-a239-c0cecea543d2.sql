-- Pricing, subscriptions, quotas, invites upgrade, and data purge migration
-- 1) Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  code text PRIMARY KEY,
  name_ar text NOT NULL,
  price_fils integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  period text NOT NULL DEFAULT 'monthly',
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
-- Public readable
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plans' AND policyname='Plans are publicly readable'
  ) THEN
    CREATE POLICY "Plans are publicly readable" ON public.plans FOR SELECT USING (true);
  END IF;
END $$;

-- 2) Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_code text NOT NULL REFERENCES public.plans(code),
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: users can read their subscriptions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can read own subscriptions'
  ) THEN
    CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can insert own subscriptions'
  ) THEN
    CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscriptions' AND policyname='Users can update own subscriptions'
  ) THEN
    CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Monthly usage table
CREATE TABLE IF NOT EXISTS public.usage_monthly (
  user_id uuid NOT NULL,
  month_start date NOT NULL,
  groups_created integer NOT NULL DEFAULT 0,
  expenses_created integer NOT NULL DEFAULT 0,
  invites_sent integer NOT NULL DEFAULT 0,
  ocr_used integer NOT NULL DEFAULT 0,
  storage_bytes bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, month_start)
);

ALTER TABLE public.usage_monthly ENABLE ROW LEVEL SECURITY;

-- RLS: users can read own usage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usage_monthly' AND policyname='Users can read own usage'
  ) THEN
    CREATE POLICY "Users can read own usage" ON public.usage_monthly FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4) Seed plans (idempotent upserts)
INSERT INTO public.plans (code, name_ar, price_fils, currency, period, limits)
VALUES
  ('free', 'مجانية', 0, 'SAR', 'monthly', '{"max_groups":2, "max_members_per_group":5, "max_expenses_per_month":200, "max_invites_per_month":50, "max_ocr_per_month":10, "storage_mb":50}'),
  ('pro_monthly', 'برو (شهري)', 1900, 'SAR', 'monthly', '{"max_groups":9999, "max_members_per_group":50, "max_expenses_per_month":999999, "max_invites_per_month":999999, "max_ocr_per_month":999999, "storage_mb":2048}'),
  ('pro_yearly', 'برو (سنوي)', 16900, 'SAR', 'yearly', '{"max_groups":9999, "max_members_per_group":50, "max_expenses_per_month":999999, "max_invites_per_month":999999, "max_ocr_per_month":999999, "storage_mb":2048}'),
  ('family5_monthly', 'عائلية 5 (شهري)', 3900, 'SAR', 'monthly', '{"max_groups":9999, "max_members_per_group":50, "max_expenses_per_month":999999, "max_invites_per_month":999999, "max_ocr_per_month":999999, "storage_mb":2048}'),
  ('family5_yearly', 'عائلية 5 (سنوي)', 34900, 'SAR', 'yearly', '{"max_groups":9999, "max_members_per_group":50, "max_expenses_per_month":999999, "max_invites_per_month":999999, "max_ocr_per_month":999999, "storage_mb":2048}')
ON CONFLICT (code) DO UPDATE SET name_ar = EXCLUDED.name_ar, price_fils = EXCLUDED.price_fils, currency = EXCLUDED.currency, period = EXCLUDED.period, limits = EXCLUDED.limits, updated_at = now();

-- 5) Helper to get current plan for a user
CREATE OR REPLACE FUNCTION public.get_current_plan(p_user uuid DEFAULT auth.uid())
RETURNS TABLE(plan_code text, period text, limits jsonb) AS $$
BEGIN
  RETURN QUERY
  WITH cur AS (
    SELECT s.plan_code
    FROM public.subscriptions s
    WHERE s.user_id = p_user AND s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now())
    ORDER BY s.current_period_end DESC NULLS LAST
    LIMIT 1
  )
  SELECT p.code, p.period, p.limits
  FROM public.plans p
  WHERE p.code = COALESCE((SELECT plan_code FROM cur), 'free');
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6) Quotas: increment_usage and assert_quota
CREATE OR REPLACE FUNCTION public.increment_usage(p_user uuid, p_action text)
RETURNS void AS $$
DECLARE v_month date := date_trunc('month', now())::date; BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  INSERT INTO public.usage_monthly(user_id, month_start)
  VALUES (p_user, v_month)
  ON CONFLICT (user_id, month_start) DO NOTHING;
  IF p_action = 'expense_created' THEN
    UPDATE public.usage_monthly SET expenses_created = expenses_created + 1, updated_at = now() WHERE user_id = p_user AND month_start = v_month;
  ELSIF p_action = 'invite_sent' THEN
    UPDATE public.usage_monthly SET invites_sent = invites_sent + 1, updated_at = now() WHERE user_id = p_user AND month_start = v_month;
  ELSIF p_action = 'ocr_used' THEN
    UPDATE public.usage_monthly SET ocr_used = ocr_used + 1, updated_at = now() WHERE user_id = p_user AND month_start = v_month;
  ELSIF p_action = 'group_created' THEN
    UPDATE public.usage_monthly SET groups_created = groups_created + 1, updated_at = now() WHERE user_id = p_user AND month_start = v_month;
  END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.assert_quota(p_action text, p_user uuid, p_group uuid DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_plan_code text;
  v_limits jsonb;
  v_month date := date_trunc('month', now())::date;
  v_max_groups int := COALESCE((v_limits ->> 'max_groups')::int, 999999);
  v_max_expenses int := COALESCE((v_limits ->> 'max_expenses_per_month')::int, 999999);
  v_max_invites int := COALESCE((v_limits ->> 'max_invites_per_month')::int, 999999);
  v_max_ocr int := COALESCE((v_limits ->> 'max_ocr_per_month')::int, 999999);
  v_max_members int := COALESCE((v_limits ->> 'max_members_per_group')::int, 999999);
  v_used int;
  v_count int;
  v_owner uuid;
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  SELECT plan_code, period, limits INTO v_plan_code, v_plan_code, v_limits FROM public.get_current_plan(p_user);

  IF p_action = 'group_created' THEN
    SELECT COUNT(*) INTO v_count FROM public.groups g WHERE g.owner_id = p_user;
    IF v_count >= v_max_groups THEN
      RAISE EXCEPTION 'quota_exceeded: لقد وصلت للحد الأقصى للمجموعات في الخطة المجانية. قم بالترقية إلى برو.' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_action = 'expense_created' THEN
    SELECT COALESCE(expenses_created,0) INTO v_used FROM public.usage_monthly WHERE user_id = p_user AND month_start = v_month;
    IF COALESCE(v_used,0) + 1 > v_max_expenses THEN
      RAISE EXCEPTION 'quota_exceeded: لقد وصلت لحد المصاريف الشهري في خطتك. قم بالترقية لرفع الحد.' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_action = 'invite_sent' THEN
    -- Per-month quota
    SELECT COALESCE(invites_sent,0) INTO v_used FROM public.usage_monthly WHERE user_id = p_user AND month_start = v_month;
    IF COALESCE(v_used,0) + 1 > v_max_invites THEN
      RAISE EXCEPTION 'quota_exceeded: لقد وصلت لحد الدعوات الشهري في خطتك. قم بالترقية.' USING ERRCODE = 'P0001';
    END IF;
    -- Rate limits: 5/min, 50/day
    SELECT COUNT(*) INTO v_count FROM public.invites WHERE inviter_id = p_user AND created_at >= now() - interval '1 minute';
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'rate_limited: تم تجاوز حد الإرسال (5 في الدقيقة). حاول لاحقاً.' USING ERRCODE = 'P0001';
    END IF;
    SELECT COUNT(*) INTO v_count FROM public.invites WHERE inviter_id = p_user AND created_at >= date_trunc('day', now());
    IF v_count >= 50 THEN
      RAISE EXCEPTION 'rate_limited: تم تجاوز حد الإرسال اليومي (50). حاول غداً.' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_action = 'ocr_used' THEN
    SELECT COALESCE(ocr_used,0) INTO v_used FROM public.usage_monthly WHERE user_id = p_user AND month_start = v_month;
    IF COALESCE(v_used,0) + 1 > v_max_ocr THEN
      RAISE EXCEPTION 'quota_exceeded: لقد وصلت لحد OCR الشهري في خطتك. قم بالترقية.' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_action = 'add_member' AND p_group IS NOT NULL THEN
    SELECT owner_id INTO v_owner FROM public.groups WHERE id = p_group;
    IF v_owner IS NULL THEN RETURN; END IF;
    -- Evaluate limit on owner's plan
    SELECT plan_code, period, limits INTO v_plan_code, v_plan_code, v_limits FROM public.get_current_plan(v_owner);
    v_max_members := COALESCE((v_limits ->> 'max_members_per_group')::int, 999999);
    SELECT COUNT(*) INTO v_count FROM public.group_members WHERE group_id = p_group;
    IF v_count >= v_max_members THEN
      RAISE EXCEPTION 'quota_exceeded: لقد وصلت للحد الأقصى لعدد أعضاء المجموعة في هذه الخطة.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7) Triggers to enforce quotas and increment usage
-- Groups
DROP TRIGGER IF EXISTS trg_groups_quota ON public.groups;
CREATE TRIGGER trg_groups_quota BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.assert_quota('group_created', NEW.owner_id, NULL);

DROP TRIGGER IF EXISTS trg_groups_usage ON public.groups;
CREATE TRIGGER trg_groups_usage AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.increment_usage(NEW.owner_id, 'group_created');

-- Expenses
DROP TRIGGER IF EXISTS trg_expenses_quota ON public.expenses;
CREATE TRIGGER trg_expenses_quota BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.assert_quota('expense_created', NEW.created_by, NEW.group_id);

DROP TRIGGER IF EXISTS trg_expenses_usage ON public.expenses;
CREATE TRIGGER trg_expenses_usage AFTER INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.increment_usage(NEW.created_by, 'expense_created');

-- Invites
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS inviter_id uuid;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS invitee_phone text;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS method text; -- 'whatsapp' | 'sms'
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS invite_link text;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Backfill inviter_id from created_by if available
UPDATE public.invites SET inviter_id = COALESCE(inviter_id, created_by);

-- Constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invites' AND indexname='invites_code_key'
  ) THEN
    CREATE UNIQUE INDEX invites_code_key ON public.invites (code);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_invites_quota ON public.invites;
CREATE TRIGGER trg_invites_quota BEFORE INSERT ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.assert_quota('invite_sent', COALESCE(NEW.inviter_id, NEW.created_by), NEW.group_id);

DROP TRIGGER IF EXISTS trg_invites_usage ON public.invites;
CREATE TRIGGER trg_invites_usage AFTER INSERT ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.increment_usage(COALESCE(NEW.inviter_id, NEW.created_by), 'invite_sent');

-- Receipt OCR
DROP TRIGGER IF EXISTS trg_ocr_quota ON public.receipt_ocr;
CREATE TRIGGER trg_ocr_quota BEFORE INSERT ON public.receipt_ocr
FOR EACH ROW EXECUTE FUNCTION public.assert_quota('ocr_used', NEW.created_by, NULL);

DROP TRIGGER IF EXISTS trg_ocr_usage ON public.receipt_ocr;
CREATE TRIGGER trg_ocr_usage AFTER INSERT ON public.receipt_ocr
FOR EACH ROW EXECUTE FUNCTION public.increment_usage(NEW.created_by, 'ocr_used');

-- Group members: enforce max members per group
DROP TRIGGER IF EXISTS trg_gm_quota ON public.group_members;
CREATE TRIGGER trg_gm_quota BEFORE INSERT ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.assert_quota('add_member', (SELECT owner_id FROM public.groups WHERE id = NEW.group_id), NEW.group_id);

-- 8) Data purge (demo data) - careful order
TRUNCATE TABLE public.expense_category_links RESTART IDENTITY;
TRUNCATE TABLE public.expense_receipts RESTART IDENTITY;
TRUNCATE TABLE public.expense_splits RESTART IDENTITY;
TRUNCATE TABLE public.expenses RESTART IDENTITY;
TRUNCATE TABLE public.settlements RESTART IDENTITY;
TRUNCATE TABLE public.budget_categories RESTART IDENTITY;
TRUNCATE TABLE public.budgets RESTART IDENTITY;
TRUNCATE TABLE public.invites RESTART IDENTITY;
TRUNCATE TABLE public.notifications RESTART IDENTITY;
TRUNCATE TABLE public.referrals RESTART IDENTITY;
TRUNCATE TABLE public.receipt_ocr RESTART IDENTITY;
TRUNCATE TABLE public.group_members RESTART IDENTITY;
TRUNCATE TABLE public.groups RESTART IDENTITY;

-- Note: Receipts bucket files should be cleared via Storage API (edge function) rather than direct SQL on storage schema.

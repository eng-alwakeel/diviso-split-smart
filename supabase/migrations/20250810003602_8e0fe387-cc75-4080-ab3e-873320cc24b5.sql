-- Fix and re-run full migration (idempotent). Most statements are guarded with IF NOT EXISTS.

-- 1) Enums (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
    CREATE TYPE public.invite_status AS ENUM ('pending','sent','accepted','revoked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
    CREATE TYPE public.referral_status AS ENUM ('pending','joined','blocked');
  END IF;
END $$;

-- 2) Profiles FK to auth.users and add name column (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='Authenticated can read categories'
  ) THEN
    CREATE POLICY "Authenticated can read categories"
    ON public.categories
    FOR SELECT TO authenticated
    USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_categories_updated_at') THEN
    CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 4) Expenses adjustments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='payer_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN payer_id UUID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='category_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN category_id UUID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='currency'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN currency TEXT NOT NULL DEFAULT 'SAR';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='note_ar'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN note_ar TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='spent_at'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN spent_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;
UPDATE public.expenses SET payer_id = created_by WHERE payer_id IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='expenses_payer_id_fkey'
  ) THEN
    ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='expenses_category_id_fkey'
  ) THEN
    ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payer_id ON public.expenses(payer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON public.expenses(spent_at);
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expenses' AND policyname='Payer can update their expenses'
  ) THEN
    CREATE POLICY "Payer can update their expenses"
    ON public.expenses
    FOR UPDATE TO authenticated
    USING (payer_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_expenses_updated_at') THEN
    CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 5) Expense splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_amount NUMERIC(12,2) NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (expense_id, member_id)
);
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_splits' AND policyname='Members can read splits of their groups'
  ) THEN
    CREATE POLICY "Members can read splits of their groups"
    ON public.expense_splits
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_splits.expense_id AND is_group_member(e.group_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_splits' AND policyname='Payer or admins can modify splits'
  ) THEN
    CREATE POLICY "Payer or admins can modify splits"
    ON public.expense_splits
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_splits.expense_id AND (e.payer_id = auth.uid() OR is_group_admin(e.group_id))
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_splits.expense_id AND (e.payer_id = auth.uid() OR is_group_admin(e.group_id))
      )
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON public.expense_splits(member_id);

-- 6) Budgets adjustments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name='category_id'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN category_id UUID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name='amount_limit'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN amount_limit NUMERIC(12,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budgets' AND column_name='starts_on'
  ) THEN
    ALTER TABLE public.budgets ADD COLUMN starts_on DATE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='budgets_category_id_fkey'
  ) THEN
    ALTER TABLE public.budgets
    ADD CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;
UPDATE public.budgets SET starts_on = start_date WHERE starts_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);

-- 7) Budget limit check trigger (fixed)
CREATE OR REPLACE FUNCTION public.check_budget_limit()
RETURNS trigger AS $$
DECLARE
  v_date DATE := COALESCE((CASE WHEN TG_OP = 'DELETE' THEN (OLD.spent_at)::date ELSE (NEW.spent_at)::date END), current_date);
  v_group UUID := COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.group_id ELSE NEW.group_id END), NULL);
  v_category UUID := COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.category_id ELSE NEW.category_id END), NULL);
  v_amount NUMERIC := COALESCE((CASE WHEN TG_OP = 'DELETE' THEN -OLD.amount ELSE NEW.amount END), 0);
  r RECORD;
  v_over BOOLEAN := false;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    FOR r IN
      SELECT 
        b.id,
        COALESCE(b.amount_limit, b.total_amount) AS limit_amt,
        COALESCE(b.starts_on, b.start_date) AS sd,
        b.end_date AS ed,
        b.category_id AS bc
      FROM public.budgets b
      WHERE b.group_id = v_group
        AND (b.category_id IS NULL OR b.category_id = v_category)
        AND (v_date >= COALESCE(b.starts_on, b.start_date)
             AND (b.end_date IS NULL OR v_date <= b.end_date))
    LOOP
      IF r.limit_amt IS NULL THEN
        CONTINUE;
      END IF;
      IF (
        (SELECT COALESCE(SUM(e.amount),0)
         FROM public.expenses e
         WHERE e.group_id = v_group
           AND (CASE WHEN r.bc IS NULL THEN true ELSE e.category_id = r.bc END)
           AND (e.spent_at::date >= r.sd AND (r.ed IS NULL OR e.spent_at::date <= r.ed))
        ) + v_amount
      ) > r.limit_amt THEN
        v_over := true;
        EXIT;
      END IF;
    END LOOP;

    IF v_over THEN
      RAISE EXCEPTION 'budget_limit_exceeded: تجاوزت المصروفات الحد المسموح للميزانية.' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='enforce_budget_limit_on_expenses') THEN
    CREATE TRIGGER enforce_budget_limit_on_expenses
    BEFORE INSERT OR UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.check_budget_limit();
  END IF;
END $$;

-- 8) Invites
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  phone_or_email TEXT NOT NULL,
  status public.invite_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invites' AND policyname='Owner/admins can read invites'
  ) THEN
    CREATE POLICY "Owner/admins can read invites"
    ON public.invites FOR SELECT TO authenticated
    USING (
      is_group_admin(group_id) OR EXISTS (
        SELECT 1 FROM public.groups g WHERE g.id = invites.group_id AND g.owner_id = auth.uid()
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invites' AND policyname='Owner/admins can manage invites'
  ) THEN
    CREATE POLICY "Owner/admins can manage invites"
    ON public.invites FOR ALL TO authenticated
    USING (
      is_group_admin(group_id) OR EXISTS (
        SELECT 1 FROM public.groups g WHERE g.id = invites.group_id AND g.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      is_group_admin(group_id) OR EXISTS (
        SELECT 1 FROM public.groups g WHERE g.id = invites.group_id AND g.owner_id = auth.uid()
      )
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_invites_updated_at') THEN
    CREATE TRIGGER set_invites_updated_at
    BEFORE UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 9) Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_phone TEXT NOT NULL,
  status public.referral_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Users can read own referrals'
  ) THEN
    CREATE POLICY "Users can read own referrals"
    ON public.referrals FOR SELECT TO authenticated
    USING (inviter_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Users can insert own referrals'
  ) THEN
    CREATE POLICY "Users can insert own referrals"
    ON public.referrals FOR INSERT TO authenticated
    WITH CHECK (inviter_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='referrals' AND policyname='Users can update own referrals'
  ) THEN
    CREATE POLICY "Users can update own referrals"
    ON public.referrals FOR UPDATE TO authenticated
    USING (inviter_id = auth.uid());
  END IF;
END $$;

-- 10) Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can read own notifications'
  ) THEN
    CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can mark own notifications as read'
  ) THEN
    CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_notifications_updated_at') THEN
    CREATE TRIGGER set_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 11) Storage bucket: receipts (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts','receipts', false)
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Group members can read receipts'
  ) THEN
    CREATE POLICY "Group members can read receipts"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'receipts' AND 
      is_group_member((storage.foldername(name))[1]::uuid)
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Group members can upload receipts'
  ) THEN
    CREATE POLICY "Group members can upload receipts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'receipts' AND 
      is_group_member((storage.foldername(name))[1]::uuid)
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Group admins can modify receipts'
  ) THEN
    CREATE POLICY "Group admins can modify receipts"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'receipts' AND 
      is_group_admin((storage.foldername(name))[1]::uuid)
    )
    WITH CHECK (
      bucket_id = 'receipts' AND 
      is_group_admin((storage.foldername(name))[1]::uuid)
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Group admins can delete receipts'
  ) THEN
    CREATE POLICY "Group admins can delete receipts"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'receipts' AND 
      is_group_admin((storage.foldername(name))[1]::uuid)
    );
  END IF;
END $$;

-- 12) RPC: get_group_balance
CREATE OR REPLACE FUNCTION public.get_group_balance(p_group_id uuid)
RETURNS TABLE (
  user_id uuid,
  amount_paid numeric,
  amount_owed numeric,
  settlements_in numeric,
  settlements_out numeric,
  net_balance numeric
) AS $$
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  RETURN QUERY
  WITH members AS (
    SELECT DISTINCT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
  ),
  paid AS (
    SELECT e.payer_id AS user_id, COALESCE(SUM(e.amount),0) AS amount_paid
    FROM public.expenses e
    WHERE e.group_id = p_group_id
    GROUP BY e.payer_id
  ),
  owed AS (
    SELECT es.member_id AS user_id, COALESCE(SUM(es.share_amount),0) AS amount_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id AND e.group_id = p_group_id
    GROUP BY es.member_id
  ),
  sin AS (
    SELECT s.to_user_id AS user_id, COALESCE(SUM(s.amount),0) AS settlements_in
    FROM public.settlements s WHERE s.group_id = p_group_id GROUP BY s.to_user_id
  ),
  sout AS (
    SELECT s.from_user_id AS user_id, COALESCE(SUM(s.amount),0) AS settlements_out
    FROM public.settlements s WHERE s.group_id = p_group_id GROUP BY s.from_user_id
  )
  SELECT m.user_id,
         COALESCE(p.amount_paid,0) AS amount_paid,
         COALESCE(o.amount_owed,0) AS amount_owed,
         COALESCE(si.settlements_in,0) AS settlements_in,
         COALESCE(so.settlements_out,0) AS settlements_out,
         COALESCE(p.amount_paid,0) - COALESCE(o.amount_owed,0) + COALESCE(si.settlements_in,0) - COALESCE(so.settlements_out,0) AS net_balance
  FROM members m
  LEFT JOIN paid p ON p.user_id = m.user_id
  LEFT JOIN owed o ON o.user_id = m.user_id
  LEFT JOIN sin si ON si.user_id = m.user_id
  LEFT JOIN sout so ON so.user_id = m.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13) RPC: get_user_dashboard
CREATE OR REPLACE FUNCTION public.get_user_dashboard(p_user_id uuid)
RETURNS TABLE (
  groups_count integer,
  total_spent_30d numeric,
  unread_notifications integer
) AS $$
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='28000';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.user_id = p_user_id) AS groups_count,
    (SELECT COALESCE(SUM(e.amount),0) FROM public.expenses e WHERE e.payer_id = p_user_id AND e.spent_at >= now() - interval '30 days') AS total_spent_30d,
    (SELECT COUNT(*) FROM public.notifications n WHERE n.user_id = p_user_id AND n.read_at IS NULL) AS unread_notifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14) Seed: sample categories (idempotent)
INSERT INTO public.categories (name_ar, icon)
SELECT * FROM (VALUES
  ('طعام', 'utensils'),
  ('نقل', 'car'),
  ('ترفيه', 'party-popper'),
  ('سكن', 'home'),
  ('فواتير', 'receipt')
) AS v(name_ar, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.name_ar = v.name_ar
);

-- 15) Seed function: demo group for current user
CREATE OR REPLACE FUNCTION public.seed_demo_for_user()
RETURNS uuid AS $$
DECLARE
  v_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE='28000';
  END IF;
  INSERT INTO public.groups (name, owner_id)
  VALUES ('المجموعة التجريبية', auth.uid()) RETURNING id INTO v_group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'admin');

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 16) Payer default
CREATE OR REPLACE FUNCTION public.set_payer_default()
RETURNS trigger AS $$
BEGIN
  IF NEW.payer_id IS NULL THEN
    NEW.payer_id := NEW.created_by;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_payer_default_on_expenses') THEN
    CREATE TRIGGER set_payer_default_on_expenses
    BEFORE INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_payer_default();
  END IF;
END $$;

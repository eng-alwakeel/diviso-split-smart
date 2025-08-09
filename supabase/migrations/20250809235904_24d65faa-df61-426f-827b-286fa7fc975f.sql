-- Enable needed extensions
create extension if not exists "pgcrypto";

-- Create enums safely
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('admin','member');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_status') THEN
    CREATE TYPE public.expense_status AS ENUM ('pending','approved','rejected');
  END IF;
END $$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_group ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status public.expense_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_creator ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

CREATE TABLE IF NOT EXISTS public.expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  approved_by uuid NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON public.expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_by ON public.expense_approvals(approved_by);

CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from ON public.settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to ON public.settlements(to_user_id);

-- updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_groups_updated_at'
  ) THEN
    CREATE TRIGGER set_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_expenses_updated_at'
  ) THEN
    CREATE TRIGGER set_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Helper functions with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Policies
-- profiles: user can read/update own profile; insert own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Profiles are viewable by owner'
  ) THEN
    CREATE POLICY "Profiles are viewable by owner" ON public.profiles
    FOR SELECT USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- groups
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read their groups' AND tablename='groups'
  ) THEN
    CREATE POLICY "Members can read their groups" ON public.groups
    FOR SELECT USING (public.is_group_member(id) OR owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Owners can create groups' AND tablename='groups'
  ) THEN
    CREATE POLICY "Owners can create groups" ON public.groups
    FOR INSERT WITH CHECK (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Admins can update groups' AND tablename='groups'
  ) THEN
    CREATE POLICY "Admins can update groups" ON public.groups
    FOR UPDATE USING (public.is_group_admin(id) OR owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Admins can delete groups' AND tablename='groups'
  ) THEN
    CREATE POLICY "Admins can delete groups" ON public.groups
    FOR DELETE USING (public.is_group_admin(id) OR owner_id = auth.uid());
  END IF;
END $$;

-- group_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read group_members of their groups' AND tablename='group_members'
  ) THEN
    CREATE POLICY "Members can read group_members of their groups" ON public.group_members
    FOR SELECT USING (public.is_group_member(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Admins can manage group members' AND tablename='group_members'
  ) THEN
    CREATE POLICY "Admins can manage group members" ON public.group_members
    FOR ALL USING (public.is_group_admin(group_id)) WITH CHECK (public.is_group_admin(group_id));
  END IF;
END $$;

-- messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read messages of their groups' AND tablename='messages'
  ) THEN
    CREATE POLICY "Members can read messages of their groups" ON public.messages
    FOR SELECT USING (public.is_group_member(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can post messages in their groups' AND tablename='messages'
  ) THEN
    CREATE POLICY "Members can post messages in their groups" ON public.messages
    FOR INSERT WITH CHECK (public.is_group_member(group_id) AND sender_id = auth.uid());
  END IF;
END $$;

-- expenses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read expenses of their groups' AND tablename='expenses'
  ) THEN
    CREATE POLICY "Members can read expenses of their groups" ON public.expenses
    FOR SELECT USING (public.is_group_member(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can create expenses in their groups' AND tablename='expenses'
  ) THEN
    CREATE POLICY "Members can create expenses in their groups" ON public.expenses
    FOR INSERT WITH CHECK (public.is_group_member(group_id) AND created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Only admins can update expenses' AND tablename='expenses'
  ) THEN
    CREATE POLICY "Only admins can update expenses" ON public.expenses
    FOR UPDATE USING (public.is_group_admin(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Only admins can delete expenses' AND tablename='expenses'
  ) THEN
    CREATE POLICY "Only admins can delete expenses" ON public.expenses
    FOR DELETE USING (public.is_group_admin(group_id));
  END IF;
END $$;

-- expense_approvals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read expense approvals of their groups' AND tablename='expense_approvals'
  ) THEN
    CREATE POLICY "Members can read expense approvals of their groups" ON public.expense_approvals
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_id AND public.is_group_member(e.group_id)
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Only admins can insert expense approvals' AND tablename='expense_approvals'
  ) THEN
    CREATE POLICY "Only admins can insert expense approvals" ON public.expense_approvals
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_id AND public.is_group_admin(e.group_id)
      ) AND approved_by = auth.uid()
    );
  END IF;
END $$;

-- settlements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can read settlements of their groups' AND tablename='settlements'
  ) THEN
    CREATE POLICY "Members can read settlements of their groups" ON public.settlements
    FOR SELECT USING (public.is_group_member(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Members can create settlements in their groups' AND tablename='settlements'
  ) THEN
    CREATE POLICY "Members can create settlements in their groups" ON public.settlements
    FOR INSERT WITH CHECK (public.is_group_member(group_id) AND created_by = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Creators or admins can update settlements' AND tablename='settlements'
  ) THEN
    CREATE POLICY "Creators or admins can update settlements" ON public.settlements
    FOR UPDATE USING (created_by = auth.uid() OR public.is_group_admin(group_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Creators or admins can delete settlements' AND tablename='settlements'
  ) THEN
    CREATE POLICY "Creators or admins can delete settlements" ON public.settlements
    FOR DELETE USING (created_by = auth.uid() OR public.is_group_admin(group_id));
  END IF;
END $$;

-- View: v_member_balance
CREATE OR REPLACE VIEW public.v_member_balance AS
WITH members AS (
  SELECT gm.group_id, gm.user_id
  FROM public.group_members gm
),
approved_expenses AS (
  SELECT e.id, e.group_id, e.created_by, e.amount
  FROM public.expenses e
  WHERE e.status = 'approved'
),
member_counts AS (
  SELECT group_id, COUNT(*)::numeric AS cnt
  FROM public.group_members
  GROUP BY group_id
),
owed AS (
  SELECT m.group_id, m.user_id, COALESCE(SUM(ae.amount / mc.cnt), 0)::numeric AS amount_owed
  FROM members m
  JOIN approved_expenses ae ON ae.group_id = m.group_id
  JOIN member_counts mc ON mc.group_id = m.group_id
  GROUP BY m.group_id, m.user_id
),
paid AS (
  SELECT ae.group_id, ae.created_by AS user_id, COALESCE(SUM(ae.amount), 0)::numeric AS amount_paid
  FROM approved_expenses ae
  GROUP BY ae.group_id, ae.created_by
),
settled_out AS (
  SELECT s.group_id, s.from_user_id AS user_id, COALESCE(SUM(s.amount), 0)::numeric AS amount_out
  FROM public.settlements s
  GROUP BY s.group_id, s.from_user_id
),
settled_in AS (
  SELECT s.group_id, s.to_user_id AS user_id, COALESCE(SUM(s.amount), 0)::numeric AS amount_in
  FROM public.settlements s
  GROUP BY s.group_id, s.to_user_id
)
SELECT
  m.group_id,
  m.user_id,
  COALESCE(p.amount_paid, 0)::numeric AS amount_paid,
  COALESCE(o.amount_owed, 0)::numeric AS amount_owed,
  COALESCE(si.amount_in, 0)::numeric AS settlements_in,
  COALESCE(so.amount_out, 0)::numeric AS settlements_out,
  (COALESCE(p.amount_paid, 0) - COALESCE(o.amount_owed, 0) + COALESCE(si.amount_in, 0) - COALESCE(so.amount_out, 0))::numeric AS net_balance
FROM members m
LEFT JOIN owed o ON o.group_id = m.group_id AND o.user_id = m.user_id
LEFT JOIN paid p ON p.group_id = m.group_id AND p.user_id = m.user_id
LEFT JOIN settled_in si ON si.group_id = m.group_id AND si.user_id = m.user_id
LEFT JOIN settled_out so ON so.group_id = m.group_id AND so.user_id = m.user_id;

-- Storage: avatars bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Avatar images are publicly accessible' AND tablename='objects' AND schemaname='storage'
  ) THEN
    CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Users can upload to their own folder or when owner matches
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Users can upload their own avatar' AND tablename='objects' AND schemaname='storage'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND (
        owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Users can update their own avatar' AND tablename='objects' AND schemaname='storage'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'avatars' AND (
        owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1]
      )
    )
    WITH CHECK (
      bucket_id = 'avatars' AND (
        owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname='Users can delete their own avatar' AND tablename='objects' AND schemaname='storage'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'avatars' AND (
        owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1]
      )
    );
  END IF;
END $$;

-- Realtime on messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Trigger to auto-create profile on new user (common Supabase pattern)
-- Note: This creates a trigger on auth.users to insert into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created' AND n.nspname = 'auth' AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

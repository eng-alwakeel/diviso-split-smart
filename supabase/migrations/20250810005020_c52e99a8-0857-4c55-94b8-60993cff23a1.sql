-- 1) Add 'owner' to member_role enum if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'member_role' AND e.enumlabel = 'owner'
  ) THEN
    ALTER TYPE public.member_role ADD VALUE IF NOT EXISTS 'owner' BEFORE 'admin';
  END IF;
END $$;

-- 2) Update is_group_admin to treat owner as admin
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('admin','owner')
  ) INTO result;
  RETURN result;
END;
$function$;

-- 3) Trigger to create profile row on signup (if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 4) updated_at triggers on groups and group_members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_groups_updated_at') THEN
    CREATE TRIGGER set_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- group_members has no updated_at column; skip trigger

-- 5) RLS adjustments (ensure owners can manage groups)
-- Existing policies already allow owner via owner_id check; ensure SELECT for members remains
-- Add explicit policy for owner full access on group_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='group_members' AND policyname='Owner can manage members'
  ) THEN
    CREATE POLICY "Owner can manage members"
    ON public.group_members
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
      )
    );
  END IF;
END $$;
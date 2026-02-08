
-- ============================================
-- Plans Feature - Phase 1 Migration
-- ============================================

-- A) plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES public.profiles(id),
  group_id uuid NULL REFERENCES public.groups(id),
  title text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('trip','outing','shared_housing','activity')),
  destination text NULL,
  start_date date NULL,
  end_date date NULL,
  budget_value numeric NULL,
  budget_currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','planning','locked','done','canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX plans_owner_idx ON public.plans(owner_user_id);
CREATE INDEX plans_group_idx ON public.plans(group_id);
CREATE INDEX plans_status_idx ON public.plans(status);

-- B) plan_members table
CREATE TABLE public.plan_members (
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);

-- C) plan_ai_summary table
CREATE TABLE public.plan_ai_summary (
  plan_id uuid PRIMARY KEY REFERENCES public.plans(id) ON DELETE CASCADE,
  intent_summary_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- D) plan_suggestions table
CREATE TABLE public.plan_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('stay','transport','activities','food','other')),
  title text NOT NULL,
  details text NULL,
  created_by text NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai','user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX plan_suggestions_plan_idx ON public.plan_suggestions(plan_id);

-- E) plan_votes table
CREATE TABLE public.plan_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz NULL
);

CREATE INDEX plan_votes_plan_idx ON public.plan_votes(plan_id);

-- F) plan_vote_options table
CREATE TABLE public.plan_vote_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid NOT NULL REFERENCES public.plan_votes(id) ON DELETE CASCADE,
  option_text text NOT NULL
);

CREATE INDEX vote_options_vote_idx ON public.plan_vote_options(vote_id);

-- G) plan_vote_responses table
CREATE TABLE public.plan_vote_responses (
  vote_id uuid NOT NULL REFERENCES public.plan_votes(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.plan_vote_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vote_id, user_id)
);

-- H) Add plan_id to expenses
ALTER TABLE public.expenses ADD COLUMN plan_id uuid NULL REFERENCES public.plans(id);
CREATE INDEX expenses_plan_idx ON public.expenses(plan_id);

-- ============================================
-- Updated_at trigger for plans
-- ============================================
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Security definer function: can_access_plan
-- ============================================
CREATE OR REPLACE FUNCTION public.can_access_plan(p_user_id uuid, p_plan_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_members WHERE plan_id = p_plan_id AND user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM plans p
    JOIN group_members gm ON gm.group_id = p.group_id
    WHERE p.id = p_plan_id AND gm.user_id = p_user_id
  );
$$;

-- Helper: check if user is owner/admin in plan
CREATE OR REPLACE FUNCTION public.is_plan_admin(p_user_id uuid, p_plan_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM plan_members
    WHERE plan_id = p_plan_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  );
$$;

-- ============================================
-- RLS Policies
-- ============================================

-- plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plans they can access"
  ON public.plans FOR SELECT
  USING (public.can_access_plan(auth.uid(), id));

CREATE POLICY "Users can create their own plans"
  ON public.plans FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Plan owner/admin can update plans"
  ON public.plans FOR UPDATE
  USING (public.is_plan_admin(auth.uid(), id));

CREATE POLICY "Plan owner can delete plans"
  ON public.plans FOR DELETE
  USING (owner_user_id = auth.uid());

-- plan_members
ALTER TABLE public.plan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan members if they can access plan"
  ON public.plan_members FOR SELECT
  USING (public.can_access_plan(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can add members"
  ON public.plan_members FOR INSERT
  WITH CHECK (public.is_plan_admin(auth.uid(), plan_id) OR user_id = auth.uid());

CREATE POLICY "Plan owner/admin can remove members"
  ON public.plan_members FOR DELETE
  USING (public.is_plan_admin(auth.uid(), plan_id) OR user_id = auth.uid());

-- plan_ai_summary
ALTER TABLE public.plan_ai_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ai summary if they can access plan"
  ON public.plan_ai_summary FOR SELECT
  USING (public.can_access_plan(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can manage ai summary"
  ON public.plan_ai_summary FOR INSERT
  WITH CHECK (public.is_plan_admin(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can update ai summary"
  ON public.plan_ai_summary FOR UPDATE
  USING (public.is_plan_admin(auth.uid(), plan_id));

-- plan_suggestions
ALTER TABLE public.plan_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions if they can access plan"
  ON public.plan_suggestions FOR SELECT
  USING (public.can_access_plan(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can add suggestions"
  ON public.plan_suggestions FOR INSERT
  WITH CHECK (public.is_plan_admin(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can delete suggestions"
  ON public.plan_suggestions FOR DELETE
  USING (public.is_plan_admin(auth.uid(), plan_id));

-- plan_votes
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes if they can access plan"
  ON public.plan_votes FOR SELECT
  USING (public.can_access_plan(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can create votes"
  ON public.plan_votes FOR INSERT
  WITH CHECK (public.is_plan_admin(auth.uid(), plan_id));

CREATE POLICY "Plan owner/admin can close votes"
  ON public.plan_votes FOR UPDATE
  USING (public.is_plan_admin(auth.uid(), plan_id));

-- plan_vote_options
ALTER TABLE public.plan_vote_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vote options if they can access the vote's plan"
  ON public.plan_vote_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plan_votes pv WHERE pv.id = vote_id AND public.can_access_plan(auth.uid(), pv.plan_id)
  ));

CREATE POLICY "Plan owner/admin can add vote options"
  ON public.plan_vote_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM plan_votes pv WHERE pv.id = vote_id AND public.is_plan_admin(auth.uid(), pv.plan_id)
  ));

-- plan_vote_responses
ALTER TABLE public.plan_vote_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vote responses if they can access the vote's plan"
  ON public.plan_vote_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plan_votes pv WHERE pv.id = vote_id AND public.can_access_plan(auth.uid(), pv.plan_id)
  ));

CREATE POLICY "Members can vote if vote is open"
  ON public.plan_vote_responses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM plan_votes pv
      WHERE pv.id = vote_id AND pv.status = 'open' AND public.can_access_plan(auth.uid(), pv.plan_id)
    )
  );

-- ============================================
-- RPCs
-- ============================================

-- RPC: create_plan
CREATE OR REPLACE FUNCTION public.create_plan(
  p_title text,
  p_plan_type text,
  p_destination text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_budget_value numeric DEFAULT NULL,
  p_budget_currency text DEFAULT 'SAR'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO plans (owner_user_id, title, plan_type, destination, start_date, end_date, budget_value, budget_currency)
  VALUES (v_user_id, p_title, p_plan_type, p_destination, p_start_date, p_end_date, p_budget_value, p_budget_currency)
  RETURNING id INTO v_plan_id;

  INSERT INTO plan_members (plan_id, user_id, role)
  VALUES (v_plan_id, v_user_id, 'owner');

  RETURN v_plan_id;
END;
$$;

-- RPC: convert_plan_to_group
CREATE OR REPLACE FUNCTION public.convert_plan_to_group(p_plan_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plan record;
  v_group_id uuid;
  v_member record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get plan and verify ownership
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND owner_user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or not owner';
  END IF;

  IF v_plan.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'Plan already linked to a group';
  END IF;

  -- Create group
  INSERT INTO groups (name, currency, owner_id, group_type)
  VALUES (v_plan.title, v_plan.budget_currency, v_user_id, 'general')
  RETURNING id INTO v_group_id;

  -- Add all plan members to the group
  FOR v_member IN SELECT user_id, role FROM plan_members WHERE plan_id = p_plan_id
  LOOP
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (
      v_group_id,
      v_member.user_id,
      CASE WHEN v_member.role = 'owner' THEN 'owner' ELSE 'member' END
    )
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END LOOP;

  -- Link plan to group and update status
  UPDATE plans SET group_id = v_group_id, status = 'planning' WHERE id = p_plan_id;

  RETURN v_group_id;
END;
$$;

-- RPC: link_plan_to_group
CREATE OR REPLACE FUNCTION public.link_plan_to_group(p_plan_id uuid, p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user is owner/admin of the plan
  IF NOT public.is_plan_admin(v_user_id, p_plan_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify user is member of the target group
  IF NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Not a member of the target group';
  END IF;

  -- Verify plan is not already linked
  IF EXISTS (SELECT 1 FROM plans WHERE id = p_plan_id AND group_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Plan already linked to a group';
  END IF;

  UPDATE plans SET group_id = p_group_id WHERE id = p_plan_id;
  RETURN true;
END;
$$;

-- RPC: update_plan_status
CREATE OR REPLACE FUNCTION public.update_plan_status(p_plan_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status NOT IN ('draft','planning','locked','done','canceled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  IF NOT public.is_plan_admin(v_user_id, p_plan_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE plans SET status = p_status WHERE id = p_plan_id;
  RETURN true;
END;
$$;

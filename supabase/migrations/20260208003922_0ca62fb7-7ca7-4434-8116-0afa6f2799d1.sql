
-- =============================================
-- Phase 4: plan_days + plan_day_activities
-- =============================================

-- Table: plan_days
CREATE TABLE public.plan_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  date date NOT NULL,
  day_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT plan_days_plan_date_unique UNIQUE (plan_id, date)
);

CREATE INDEX plan_days_plan_idx ON public.plan_days (plan_id);

-- Table: plan_day_activities
CREATE TABLE public.plan_day_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id uuid NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_slot text NOT NULL DEFAULT 'any' CHECK (time_slot IN ('morning','afternoon','evening','any')),
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','proposed','locked')),
  estimated_cost numeric,
  currency text DEFAULT 'SAR',
  participant_scope text NOT NULL DEFAULT 'all' CHECK (participant_scope IN ('all','custom')),
  participant_user_ids uuid[],
  created_by text NOT NULL DEFAULT 'user' CHECK (created_by IN ('ai','user')),
  linked_expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  linked_vote_id uuid REFERENCES public.plan_votes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX plan_day_activities_day_idx ON public.plan_day_activities (plan_day_id);
CREATE INDEX plan_day_activities_status_idx ON public.plan_day_activities (status);

-- =============================================
-- Function: ensure_plan_days
-- =============================================
CREATE OR REPLACE FUNCTION public.ensure_plan_days(p_plan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date;
  v_end date;
  v_date date;
  v_idx int;
BEGIN
  SELECT start_date, end_date INTO v_start, v_end
  FROM plans WHERE id = p_plan_id;

  -- If either date is null, do nothing
  IF v_start IS NULL OR v_end IS NULL THEN
    RETURN;
  END IF;

  -- Insert missing days
  v_date := v_start;
  WHILE v_date <= v_end LOOP
    INSERT INTO plan_days (plan_id, date, day_index)
    VALUES (p_plan_id, v_date, 0)
    ON CONFLICT (plan_id, date) DO NOTHING;
    v_date := v_date + 1;
  END LOOP;

  -- Delete days outside the range ONLY if they have no activities
  DELETE FROM plan_days
  WHERE plan_id = p_plan_id
    AND (date < v_start OR date > v_end)
    AND NOT EXISTS (
      SELECT 1 FROM plan_day_activities WHERE plan_day_id = plan_days.id
    );

  -- Reindex day_index sequentially
  v_idx := 1;
  FOR v_date IN
    SELECT pd.date FROM plan_days pd WHERE pd.plan_id = p_plan_id ORDER BY pd.date
  LOOP
    UPDATE plan_days SET day_index = v_idx WHERE plan_id = p_plan_id AND date = v_date;
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

-- =============================================
-- Trigger: auto-call ensure_plan_days on plans update
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_ensure_plan_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger if start_date or end_date changed
  IF (OLD.start_date IS DISTINCT FROM NEW.start_date)
     OR (OLD.end_date IS DISTINCT FROM NEW.end_date) THEN
    PERFORM public.ensure_plan_days(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_plans_ensure_days
  AFTER UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ensure_plan_days();

-- =============================================
-- RLS for plan_days
-- =============================================
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan days if they can access plan"
  ON public.plan_days FOR SELECT
  USING (public.can_access_plan(auth.uid(), plan_id));

CREATE POLICY "Plan admin can insert plan days"
  ON public.plan_days FOR INSERT
  WITH CHECK (public.is_plan_admin(auth.uid(), plan_id));

CREATE POLICY "Plan admin can update plan days"
  ON public.plan_days FOR UPDATE
  USING (public.is_plan_admin(auth.uid(), plan_id));

CREATE POLICY "Plan admin can delete plan days"
  ON public.plan_days FOR DELETE
  USING (public.is_plan_admin(auth.uid(), plan_id));

-- =============================================
-- RLS for plan_day_activities
-- =============================================
ALTER TABLE public.plan_day_activities ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone who can access the plan
CREATE POLICY "Users can view activities if they can access plan"
  ON public.plan_day_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM plan_days pd
    WHERE pd.id = plan_day_id
      AND public.can_access_plan(auth.uid(), pd.plan_id)
  ));

-- INSERT: any plan member can add activities
CREATE POLICY "Plan members can add activities"
  ON public.plan_day_activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM plan_days pd
    WHERE pd.id = plan_day_id
      AND public.can_access_plan(auth.uid(), pd.plan_id)
  ));

-- UPDATE: plan admin can update any activity
CREATE POLICY "Plan admin can update activities"
  ON public.plan_day_activities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM plan_days pd
    WHERE pd.id = plan_day_id
      AND public.is_plan_admin(auth.uid(), pd.plan_id)
  ));

-- DELETE: plan admin only
CREATE POLICY "Plan admin can delete activities"
  ON public.plan_day_activities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM plan_days pd
    WHERE pd.id = plan_day_id
      AND public.is_plan_admin(auth.uid(), pd.plan_id)
  ));

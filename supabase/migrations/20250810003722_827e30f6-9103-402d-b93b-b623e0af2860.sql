-- Fix linter: set search_path on functions
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
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_payer_default()
RETURNS trigger AS $$
BEGIN
  IF NEW.payer_id IS NULL THEN
    NEW.payer_id := NEW.created_by;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SET search_path = public;
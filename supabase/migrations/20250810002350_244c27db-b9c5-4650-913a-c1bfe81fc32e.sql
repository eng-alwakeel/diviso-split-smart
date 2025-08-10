-- 1) Create enum for budget periods if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budget_period') THEN
    CREATE TYPE public.budget_period AS ENUM ('weekly','monthly','quarterly','yearly','custom');
  END IF;
END $$;

-- 2) Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period public.budget_period NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT current_date,
  end_date DATE,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Create budget_categories table
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Create expense_category_links table (link expenses to budget categories)
CREATE TABLE IF NOT EXISTS public.expense_category_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  budget_category_id UUID NOT NULL REFERENCES public.budget_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (expense_id, budget_category_id)
);

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_budgets_group_id ON public.budgets(group_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON public.budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON public.budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_expense_category_links_expense_id ON public.expense_category_links(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_category_links_budget_category_id ON public.expense_category_links(budget_category_id);

-- 6) RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_category_links ENABLE ROW LEVEL SECURITY;

-- Policies for budgets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budgets' AND policyname='Members can read budgets of their groups'
  ) THEN
    CREATE POLICY "Members can read budgets of their groups"
    ON public.budgets
    FOR SELECT
    USING (is_group_member(group_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budgets' AND policyname='Members can create budgets in their groups'
  ) THEN
    CREATE POLICY "Members can create budgets in their groups"
    ON public.budgets
    FOR INSERT
    WITH CHECK (is_group_member(group_id) AND created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budgets' AND policyname='Only admins can update budgets'
  ) THEN
    CREATE POLICY "Only admins can update budgets"
    ON public.budgets
    FOR UPDATE
    USING (is_group_admin(group_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budgets' AND policyname='Only admins can delete budgets'
  ) THEN
    CREATE POLICY "Only admins can delete budgets"
    ON public.budgets
    FOR DELETE
    USING (is_group_admin(group_id));
  END IF;
END $$;

-- Policies for budget_categories (via budgets join)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budget_categories' AND policyname='Members can read budget categories of their groups'
  ) THEN
    CREATE POLICY "Members can read budget categories of their groups"
    ON public.budget_categories
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_categories.budget_id AND is_group_member(b.group_id)
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budget_categories' AND policyname='Only admins can create budget categories'
  ) THEN
    CREATE POLICY "Only admins can create budget categories"
    ON public.budget_categories
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_categories.budget_id AND is_group_admin(b.group_id)
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budget_categories' AND policyname='Only admins can update budget categories'
  ) THEN
    CREATE POLICY "Only admins can update budget categories"
    ON public.budget_categories
    FOR UPDATE
    USING (EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_categories.budget_id AND is_group_admin(b.group_id)
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='budget_categories' AND policyname='Only admins can delete budget categories'
  ) THEN
    CREATE POLICY "Only admins can delete budget categories"
    ON public.budget_categories
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_categories.budget_id AND is_group_admin(b.group_id)
    ));
  END IF;
END $$;

-- Policies for expense_category_links (tie to both expense group and budget group, and require same group)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_category_links' AND policyname='Members can read expense-category links of their groups'
  ) THEN
    CREATE POLICY "Members can read expense-category links of their groups"
    ON public.expense_category_links
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.budget_categories bc ON bc.id = expense_category_links.budget_category_id
      JOIN public.budgets b ON b.id = bc.budget_id
      WHERE e.id = expense_category_links.expense_id
        AND e.group_id = b.group_id
        AND is_group_member(e.group_id)
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_category_links' AND policyname='Only admins can create expense-category links'
  ) THEN
    CREATE POLICY "Only admins can create expense-category links"
    ON public.expense_category_links
    FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.budget_categories bc ON bc.id = expense_category_links.budget_category_id
      JOIN public.budgets b ON b.id = bc.budget_id
      WHERE e.id = expense_category_links.expense_id
        AND e.group_id = b.group_id
        AND is_group_admin(e.group_id)
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_category_links' AND policyname='Only admins can delete expense-category links'
  ) THEN
    CREATE POLICY "Only admins can delete expense-category links"
    ON public.expense_category_links
    FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.budget_categories bc ON bc.id = expense_category_links.budget_category_id
      JOIN public.budgets b ON b.id = bc.budget_id
      WHERE e.id = expense_category_links.expense_id
        AND e.group_id = b.group_id
        AND is_group_admin(e.group_id)
    ));
  END IF;
END $$;

-- 7) updated_at triggers using existing function
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_budgets_updated_at') THEN
    CREATE TRIGGER set_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_budget_categories_updated_at') THEN
    CREATE TRIGGER set_budget_categories_updated_at
    BEFORE UPDATE ON public.budget_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 8) Budget summary view for quick aggregates
CREATE OR REPLACE VIEW public.v_budget_summary
WITH (security_invoker = true)
AS
SELECT
  b.id AS budget_id,
  b.group_id,
  b.name,
  b.period,
  b.start_date,
  b.end_date,
  b.total_amount,
  COALESCE(SUM(DISTINCT bc.allocated_amount) FILTER (WHERE bc.id IS NOT NULL), 0) AS total_allocated,
  COUNT(DISTINCT bc.id) AS categories_count,
  COALESCE(SUM(e.amount) FILTER (
    WHERE e.id IS NOT NULL
      AND e.status::text = 'approved'
      AND (e.created_at::date) >= b.start_date
      AND (b.end_date IS NULL OR e.created_at::date <= b.end_date)
  ), 0) AS total_spent
FROM public.budgets b
LEFT JOIN public.budget_categories bc ON bc.budget_id = b.id
LEFT JOIN public.expense_category_links l ON l.budget_category_id = bc.id
LEFT JOIN public.expenses e ON e.id = l.expense_id AND e.group_id = b.group_id
GROUP BY b.id;

-- RLS for view: expose only rows belonging to member groups by creating policy on the base table suffices, but we can add a security barrier via dependent SELECTs in code.

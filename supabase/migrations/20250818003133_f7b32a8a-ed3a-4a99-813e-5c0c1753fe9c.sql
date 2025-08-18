-- حذف الميزانيات المكررة (التي بدون فئات)
DELETE FROM budgets 
WHERE group_id = 'eead203e-5744-4306-9358-0c24c25448d0' 
AND id IN (
  '7f0a340c-53fe-405a-b7e9-0da475275ca6',
  '13aef509-d98c-4c74-990b-a369149a1e62', 
  '969a34d4-4e49-4f59-9a53-c9e14ac545ef'
);

-- إنشاء جدول expense_budget_links لربط المصاريف بفئات الميزانية مباشرة
CREATE TABLE IF NOT EXISTS expense_budget_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  budget_category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, budget_category_id)
);

-- تمكين RLS على الجدول الجديد
ALTER TABLE expense_budget_links ENABLE ROW LEVEL SECURITY;

-- إضافة RLS policies للجدول الجديد
CREATE POLICY "Members can read expense budget links of their groups" 
ON expense_budget_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN budgets b ON b.group_id = e.group_id
    JOIN budget_categories bc ON bc.budget_id = b.id
    WHERE e.id = expense_budget_links.expense_id 
    AND bc.id = expense_budget_links.budget_category_id
    AND is_group_member(e.group_id)
  )
);

CREATE POLICY "Members can create expense budget links for their expenses" 
ON expense_budget_links 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN budgets b ON b.group_id = e.group_id
    JOIN budget_categories bc ON bc.budget_id = b.id
    WHERE e.id = expense_budget_links.expense_id 
    AND bc.id = expense_budget_links.budget_category_id
    AND is_group_member(e.group_id)
    AND (e.created_by = auth.uid() OR e.payer_id = auth.uid())
  )
);

CREATE POLICY "Admins and creators can delete expense budget links" 
ON expense_budget_links 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN budgets b ON b.group_id = e.group_id
    JOIN budget_categories bc ON bc.budget_id = b.id
    WHERE e.id = expense_budget_links.expense_id 
    AND bc.id = expense_budget_links.budget_category_id
    AND (is_group_admin(e.group_id) OR e.created_by = auth.uid() OR e.payer_id = auth.uid())
  )
);

-- ربط المصاريف الموجودة بفئات الميزانية المناسبة
INSERT INTO expense_budget_links (expense_id, budget_category_id)
SELECT 
  e.id as expense_id,
  bc.id as budget_category_id
FROM expenses e
JOIN budget_categories bc ON bc.category_id = e.category_id
JOIN budgets b ON b.id = bc.budget_id
WHERE e.group_id = 'eead203e-5744-4306-9358-0c24c25448d0'
AND e.status = 'approved'
ON CONFLICT (expense_id, budget_category_id) DO NOTHING;

-- تحديث function لتتبع الميزانيات بشكل أفضل
CREATE OR REPLACE FUNCTION public.get_group_budget_tracking_v2(p_group_id uuid)
RETURNS TABLE(
  budget_id uuid,
  budget_name text,
  category_id uuid, 
  category_name text, 
  budgeted_amount numeric, 
  spent_amount numeric, 
  remaining_amount numeric, 
  spent_percentage numeric, 
  status text, 
  expense_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not_group_member' USING ERRCODE='28000';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id as budget_id,
    b.name as budget_name,
    bc.category_id,
    c.name_ar as category_name,
    bc.allocated_amount as budgeted_amount,
    COALESCE(spent.total_spent, 0) as spent_amount,
    bc.allocated_amount - COALESCE(spent.total_spent, 0) as remaining_amount,
    CASE 
      WHEN bc.allocated_amount > 0 
      THEN (COALESCE(spent.total_spent, 0) / bc.allocated_amount * 100)
      ELSE 0 
    END as spent_percentage,
    CASE 
      WHEN bc.allocated_amount = 0 THEN 'no_budget'
      WHEN COALESCE(spent.total_spent, 0) > bc.allocated_amount THEN 'exceeded'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.9 THEN 'critical'
      WHEN COALESCE(spent.total_spent, 0) / bc.allocated_amount >= 0.8 THEN 'warning'
      ELSE 'safe'
    END as status,
    COALESCE(spent.expense_count, 0)::integer as expense_count
  FROM budgets b
  JOIN budget_categories bc ON bc.budget_id = b.id
  LEFT JOIN categories c ON c.id = bc.category_id
  LEFT JOIN (
    SELECT 
      ebl.budget_category_id,
      SUM(e.amount) as total_spent,
      COUNT(e.id) as expense_count
    FROM expense_budget_links ebl
    JOIN expenses e ON e.id = ebl.expense_id
    WHERE e.group_id = p_group_id 
    AND e.status = 'approved'
    GROUP BY ebl.budget_category_id
  ) spent ON spent.budget_category_id = bc.id
  WHERE b.group_id = p_group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  ORDER BY spent_percentage DESC NULLS LAST;
END;
$function$;

-- إنشاء trigger لربط المصاريف الجديدة تلقائياً
CREATE OR REPLACE FUNCTION public.auto_link_expense_to_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- ربط المصروف بأول فئة ميزانية مطابقة ونشطة
  INSERT INTO expense_budget_links (expense_id, budget_category_id)
  SELECT 
    NEW.id,
    bc.id
  FROM budget_categories bc
  JOIN budgets b ON b.id = bc.budget_id
  WHERE bc.category_id = NEW.category_id
  AND b.group_id = NEW.group_id
  AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
  AND b.start_date <= CURRENT_DATE
  LIMIT 1
  ON CONFLICT (expense_id, budget_category_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة trigger للمصاريف الجديدة والمعتمدة
DROP TRIGGER IF EXISTS trigger_auto_link_expense_to_budget ON expenses;
CREATE TRIGGER trigger_auto_link_expense_to_budget
  AFTER INSERT ON expenses
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND NEW.category_id IS NOT NULL)
  EXECUTE FUNCTION auto_link_expense_to_budget();

-- trigger للمصاريف المحدثة (عند تغيير الحالة إلى approved)
DROP TRIGGER IF EXISTS trigger_auto_link_expense_to_budget_update ON expenses;
CREATE TRIGGER trigger_auto_link_expense_to_budget_update
  AFTER UPDATE ON expenses
  FOR EACH ROW
  WHEN (OLD.status != 'approved' AND NEW.status = 'approved' AND NEW.category_id IS NOT NULL)
  EXECUTE FUNCTION auto_link_expense_to_budget();
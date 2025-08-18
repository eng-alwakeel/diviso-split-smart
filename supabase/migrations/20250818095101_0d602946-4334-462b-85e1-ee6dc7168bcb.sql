-- إزالة الـ trigger الذي يمنع تجاوز الميزانية
DROP TRIGGER IF EXISTS enforce_budget_limit_on_expenses ON public.expenses;

-- إضافة فئة "المشاريع" (بدون ON CONFLICT)
INSERT INTO public.categories (name_ar, icon) 
SELECT 'المشاريع', 'briefcase'
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories WHERE name_ar = 'المشاريع'
);
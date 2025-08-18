-- إزالة الـ trigger الذي يمنع تجاوز الميزانية
DROP TRIGGER IF EXISTS enforce_budget_limit_on_expenses ON public.expenses;

-- إضافة فئة "المشاريع" المفقودة
INSERT INTO public.categories (name_ar, icon) 
VALUES ('المشاريع', 'briefcase')
ON CONFLICT (name_ar) DO NOTHING;
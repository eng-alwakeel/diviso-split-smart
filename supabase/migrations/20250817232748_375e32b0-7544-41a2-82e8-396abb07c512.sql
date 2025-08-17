-- Add category_id to budget_categories table for proper linking
ALTER TABLE public.budget_categories 
ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Update existing budget_categories to link with categories (use LIMIT 1 to avoid multiple rows error)
UPDATE public.budget_categories 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE c.name_ar = budget_categories.name
  LIMIT 1
)
WHERE budget_categories.category_id IS NULL;

-- Create missing categories for budget_categories that don't have a match
INSERT INTO public.categories (name_ar, created_by)
SELECT DISTINCT bc.name, b.created_by
FROM public.budget_categories bc
JOIN public.budgets b ON bc.budget_id = b.id
LEFT JOIN public.categories c ON c.name_ar = bc.name
WHERE c.id IS NULL AND bc.category_id IS NULL;

-- Update budget_categories again for newly created categories
UPDATE public.budget_categories 
SET category_id = (
  SELECT c.id 
  FROM public.categories c 
  WHERE c.name_ar = budget_categories.name
  LIMIT 1
)
WHERE budget_categories.category_id IS NULL;
-- Add created_by to categories and policies for ownership
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Allow owners to insert their own categories
CREATE POLICY "Users can insert own categories"
ON public.categories
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Allow owners to update their own categories
CREATE POLICY "Users can update own categories"
ON public.categories
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

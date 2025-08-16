-- Phase 1: Fix RLS policies for rejected expenses to allow editing
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Only admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Payer can update their expenses" ON public.expenses;

-- Recreate policies with support for rejected expense editing
CREATE POLICY "Admins can update all expenses" 
ON public.expenses 
FOR UPDATE 
USING (is_group_admin(group_id));

CREATE POLICY "Users can update their own rejected expenses" 
ON public.expenses 
FOR UPDATE 
USING (payer_id = auth.uid() AND status = 'rejected');

CREATE POLICY "Users can update their own pending expenses" 
ON public.expenses 
FOR UPDATE 
USING (payer_id = auth.uid() AND status = 'pending');

-- Create table for expense rejection reasons
CREATE TABLE IF NOT EXISTS public.expense_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  rejected_by UUID NOT NULL,
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expense_rejections
ALTER TABLE public.expense_rejections ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_rejections
CREATE POLICY "Members can read rejection reasons for group expenses" 
ON public.expense_rejections 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_rejections.expense_id 
    AND is_group_member(e.group_id)
  )
);

CREATE POLICY "Admins can create rejection reasons" 
ON public.expense_rejections 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_rejections.expense_id 
    AND is_group_admin(e.group_id)
  ) 
  AND rejected_by = auth.uid()
);

-- Enable realtime for balance-affecting tables
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.settlements REPLICA IDENTITY FULL;
ALTER TABLE public.expense_splits REPLICA IDENTITY FULL;
ALTER TABLE public.expense_rejections REPLICA IDENTITY FULL;

-- Add tables to realtime publication using proper syntax
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_rejections;
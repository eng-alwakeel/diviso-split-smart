-- Add group_type column to groups table
ALTER TABLE public.groups 
ADD COLUMN group_type text DEFAULT 'general';

-- Create enum-like constraint for group types
ALTER TABLE public.groups 
ADD CONSTRAINT groups_group_type_check 
CHECK (group_type IN ('trip', 'party', 'home', 'work', 'project', 'general'));

-- Update existing groups to have a default type
UPDATE public.groups 
SET group_type = 'general' 
WHERE group_type IS NULL;
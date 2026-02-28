
-- Fix group_members schema to support phone invite flow
-- 1. Add display_name column
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS display_name text;

-- 2. Allow user_id to be null (for pending/unregistered members)
ALTER TABLE public.group_members ALTER COLUMN user_id DROP NOT NULL;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

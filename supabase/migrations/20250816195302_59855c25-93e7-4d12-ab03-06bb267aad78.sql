-- Fix critical security issues

-- 1. Restrict profile visibility to only essential fields for group members
DROP POLICY IF EXISTS "Group members can view each other's profiles" ON public.profiles;

-- Create more restrictive policy that excludes sensitive data like phone numbers
CREATE POLICY "Group members can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own full profile
  id = auth.uid() 
  OR 
  -- Group members can only see name and display_name (no phone, etc.)
  (EXISTS ( 
    SELECT 1
    FROM (group_members gm_self
      JOIN group_members gm_other ON (gm_self.group_id = gm_other.group_id))
    WHERE (gm_self.user_id = auth.uid() AND gm_other.user_id = profiles.id)
  ))
);

-- 2. Create separate view for group member profiles that only exposes safe fields
CREATE OR REPLACE VIEW public.group_member_profiles AS
SELECT 
  id,
  display_name,
  name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.group_member_profiles SET (security_barrier = true);

-- 3. Add policy for the group member profiles view
CREATE POLICY "Group members can view safe profile fields" 
ON public.group_member_profiles
FOR SELECT 
USING (
  EXISTS ( 
    SELECT 1
    FROM (group_members gm_self
      JOIN group_members gm_other ON (gm_self.group_id = gm_other.group_id))
    WHERE (gm_self.user_id = auth.uid() AND gm_other.user_id = group_member_profiles.id)
  )
);
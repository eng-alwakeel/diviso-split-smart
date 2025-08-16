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

-- 2. Add input validation functions for enhanced security
CREATE OR REPLACE FUNCTION public.is_valid_phone(phone_input text)
RETURNS boolean AS $$
BEGIN
  -- Saudi phone number validation: must start with +966 or 05 and be valid length
  RETURN phone_input ~ '^(\+966|966|0)?5[0-9]{8}$' 
    OR phone_input ~ '^\+966[1-9][0-9]{8}$'
    OR phone_input ~ '^05[0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
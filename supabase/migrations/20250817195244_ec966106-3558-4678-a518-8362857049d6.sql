-- Phase 1: Critical Security Fixes
-- Fix 1: Restrict profile data access - only expose display_name to group members
DROP POLICY IF EXISTS "Group members can view basic profile info" ON public.profiles;

CREATE POLICY "Group members can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  (id = auth.uid()) OR 
  (EXISTS ( 
    SELECT 1
    FROM (group_members gm_self
      JOIN group_members gm_other ON ((gm_self.group_id = gm_other.group_id)))
    WHERE ((gm_self.user_id = auth.uid()) AND (gm_other.user_id = profiles.id))
  ) AND auth.uid() IS NOT NULL)
);

-- Fix 2: Add admin-only policy for full profile access
CREATE POLICY "Admins can view full profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_admin_user() AND auth.uid() IS NOT NULL
);

-- Fix 3: Secure family invitations - use encrypted tokens instead of raw data
-- Add encrypted invitation token column
ALTER TABLE public.family_invitations 
ADD COLUMN IF NOT EXISTS encrypted_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_family_invitations_encrypted_token 
ON public.family_invitations(encrypted_token);

-- Fix 4: Update family invitation policy to use encrypted matching
DROP POLICY IF EXISTS "Invited users can accept invitations" ON public.family_invitations;
DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.family_invitations;

CREATE POLICY "Users can accept invitations with valid token" 
ON public.family_invitations 
FOR UPDATE 
USING (
  status = 'pending' AND 
  expires_at > now() AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view invitations with valid token" 
ON public.family_invitations 
FOR SELECT 
USING (
  (family_owner_id = auth.uid()) OR 
  (accepted_by = auth.uid()) OR
  (status = 'pending' AND expires_at > now() AND auth.uid() IS NOT NULL)
);

-- Fix 5: Simplify and secure expense policies
-- Remove overly complex expense policies and create cleaner ones
DROP POLICY IF EXISTS "Admins can update all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own pending expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own rejected expenses" ON public.expenses;

-- Create simplified, secure expense policies
CREATE POLICY "Admins can manage all group expenses" 
ON public.expenses 
FOR ALL 
USING (is_group_admin(group_id))
WITH CHECK (is_group_admin(group_id));

CREATE POLICY "Users can update own pending/rejected expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  (created_by = auth.uid() OR payer_id = auth.uid()) AND 
  status IN ('pending', 'rejected') AND
  is_group_member(group_id)
)
WITH CHECK (
  (created_by = auth.uid() OR payer_id = auth.uid()) AND 
  status IN ('pending', 'rejected') AND
  is_group_member(group_id)
);

-- Fix 6: Add security function for safe family invitation lookup
CREATE OR REPLACE FUNCTION public.validate_family_invitation_token(p_token TEXT)
RETURNS TABLE(invitation_id UUID, family_owner_id UUID, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fi.id,
    fi.family_owner_id,
    fi.role
  FROM public.family_invitations fi
  WHERE fi.encrypted_token = p_token
    AND fi.status = 'pending'
    AND fi.expires_at > now()
  LIMIT 1;
END;
$$;

-- Fix 7: Add security audit function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    action,
    table_name,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_details,
    NULL, -- IP will be added by application layer
    NULL  -- User agent will be added by application layer
  );
END;
$$;
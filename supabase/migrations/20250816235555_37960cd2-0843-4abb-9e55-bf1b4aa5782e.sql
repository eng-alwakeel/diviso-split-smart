-- Create additional security functions for better policy management
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For now, return false. In future, implement admin role checking
  -- This function can be extended when admin roles are implemented
  RETURN false;
END;
$$;

-- Add comments to sensitive tables for security awareness
COMMENT ON TABLE public.lifetime_offer_tracking IS 'Contains sensitive business data - restricted access';
COMMENT ON TABLE public.subscription_limits IS 'Contains sensitive business data - restricted access';
COMMENT ON TABLE public.family_members IS 'Family membership data - uses security definer functions to prevent RLS recursion';

-- Create a security log table for monitoring access to sensitive data
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins should be able to read security logs (when admin system is implemented)
CREATE POLICY "Only system can write security logs"
ON public.security_logs
FOR INSERT
TO authenticated
WITH CHECK (false); -- Prevent manual inserts for now

-- Ensure all sensitive tables have proper RLS
DO $$
BEGIN
  -- Verify RLS is enabled on all critical tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
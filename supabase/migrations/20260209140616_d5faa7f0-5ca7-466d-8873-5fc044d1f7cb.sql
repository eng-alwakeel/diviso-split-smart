
-- Fix: Replace permissive INSERT/UPDATE policies on user_reputation with service_role-only access
-- This prevents any authenticated user from directly manipulating reputation scores

DROP POLICY IF EXISTS "System can insert reputation" ON public.user_reputation;
DROP POLICY IF EXISTS "System can update reputation" ON public.user_reputation;

-- Only service_role (used by SECURITY DEFINER triggers) can insert/update
CREATE POLICY "Service role can insert reputation"
ON public.user_reputation FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update reputation"
ON public.user_reputation FOR UPDATE
TO service_role
USING (true);

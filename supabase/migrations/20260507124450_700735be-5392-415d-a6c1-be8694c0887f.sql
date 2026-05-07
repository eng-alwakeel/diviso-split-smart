
-- 1. demo_sessions: remove tautological UPDATE policy. Conversion happens server-side via edge functions (service_role bypasses RLS).
DROP POLICY IF EXISTS "Users can update their own demo session" ON public.demo_sessions;

-- 2. metrics_daily: remove permissive ALL policy. service_role (used by edge functions / cron) bypasses RLS automatically.
DROP POLICY IF EXISTS "System can manage metrics_daily" ON public.metrics_daily;

-- 3. family_invitations: require invited email or phone to match the authenticated user before accepting.
DROP POLICY IF EXISTS "Users can accept invitations with valid token" ON public.family_invitations;
CREATE POLICY "Users can accept invitations with valid token"
ON public.family_invitations
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND expires_at > now()
  AND auth.uid() IS NOT NULL
  AND (
    invited_email = (auth.jwt() ->> 'email')
    OR invited_phone = (auth.jwt() ->> 'phone')
  )
)
WITH CHECK (
  status IN ('accepted','pending')
  AND (
    invited_email = (auth.jwt() ->> 'email')
    OR invited_phone = (auth.jwt() ->> 'phone')
  )
);

-- 4. security_logs: remove permissive WITH CHECK true insert policy. Logging happens via SECURITY DEFINER RPC (log_security_event) and service_role.
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;

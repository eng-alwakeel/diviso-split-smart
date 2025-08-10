-- Enforce SECURITY INVOKER for all public views to satisfy linter and ensure RLS of caller applies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true);', r.table_schema, r.table_name);
  END LOOP;
END $$;
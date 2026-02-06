-- Fix security warnings: Add search_path to validation functions

-- Fix validate_bio_length function
CREATE OR REPLACE FUNCTION public.validate_bio_length()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 120 THEN
    RAISE EXCEPTION 'Bio must be 120 characters or less';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix validate_group_status function
CREATE OR REPLACE FUNCTION public.validate_group_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'closed') THEN
    RAISE EXCEPTION 'Group status must be either active or closed';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix validate_rating_values function
CREATE OR REPLACE FUNCTION public.validate_rating_values()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.financial_commitment < 1 OR NEW.financial_commitment > 5 THEN
    RAISE EXCEPTION 'financial_commitment must be between 1 and 5';
  END IF;
  IF NEW.time_commitment < 1 OR NEW.time_commitment > 5 THEN
    RAISE EXCEPTION 'time_commitment must be between 1 and 5';
  END IF;
  IF NEW.cooperation < 1 OR NEW.cooperation > 5 THEN
    RAISE EXCEPTION 'cooperation must be between 1 and 5';
  END IF;
  IF NEW.rater_id = NEW.rated_user_id THEN
    RAISE EXCEPTION 'Cannot rate yourself';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix user_reputation RLS policies - only allow system (triggers) to insert/update
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert reputation" ON public.user_reputation;
DROP POLICY IF EXISTS "System can update reputation" ON public.user_reputation;

-- The trigger function runs with SECURITY DEFINER so it bypasses RLS
-- We don't need INSERT/UPDATE policies for regular users since only the trigger should modify this table
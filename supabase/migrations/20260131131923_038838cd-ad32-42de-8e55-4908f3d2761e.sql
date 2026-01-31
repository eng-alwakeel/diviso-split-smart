-- Fix get_founding_program_stats to count ONLY founding users
-- Previously it was counting ALL profiles, which is incorrect

CREATE OR REPLACE FUNCTION public.get_founding_program_stats()
RETURNS JSON AS $$
DECLARE
  v_founders_count INTEGER;
  v_limit INTEGER := 1000;
  v_remaining INTEGER;
  v_is_closed BOOLEAN;
BEGIN
  -- Count ONLY founding users (is_founding_user = true)
  SELECT COUNT(*) INTO v_founders_count 
  FROM profiles 
  WHERE is_founding_user = true;
  
  -- Calculate remaining spots
  v_remaining := GREATEST(0, v_limit - v_founders_count);
  v_is_closed := (v_remaining = 0);
  
  RETURN json_build_object(
    'total', v_founders_count,
    'remaining', v_remaining,
    'limit', v_limit,
    'isClosed', v_is_closed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO authenticated;
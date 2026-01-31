-- Create RPC function to get founding program stats (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_founding_program_stats()
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_limit INTEGER := 1000;
  v_remaining INTEGER;
  v_is_closed BOOLEAN;
BEGIN
  -- Get total count of users
  SELECT COUNT(*) INTO v_total FROM profiles;
  
  -- Calculate remaining spots
  v_remaining := GREATEST(0, v_limit - v_total);
  v_is_closed := (v_remaining = 0);
  
  RETURN json_build_object(
    'total', v_total,
    'remaining', v_remaining,
    'limit', v_limit,
    'isClosed', v_is_closed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_founding_program_stats() TO authenticated;
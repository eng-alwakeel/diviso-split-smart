-- Create function to increment lifetime purchases
CREATE OR REPLACE FUNCTION public.increment_lifetime_purchases()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Get current status
  SELECT total_purchased, max_limit
  INTO v_current_count, v_max_limit
  FROM public.lifetime_offer_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if offer is still available
  IF v_current_count >= v_max_limit THEN
    RETURN false;
  END IF;
  
  -- Increment the count
  UPDATE public.lifetime_offer_tracking
  SET 
    total_purchased = total_purchased + 1,
    updated_at = now(),
    offer_active = CASE 
      WHEN (total_purchased + 1) >= max_limit THEN false 
      ELSE true 
    END
  WHERE id = (
    SELECT id FROM public.lifetime_offer_tracking 
    ORDER BY created_at DESC 
    LIMIT 1
  );
  
  RETURN true;
END;
$function$
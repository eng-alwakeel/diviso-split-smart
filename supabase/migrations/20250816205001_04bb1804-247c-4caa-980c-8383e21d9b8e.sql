-- Create function to check offer availability
CREATE OR REPLACE FUNCTION public.check_lifetime_offer_availability()
RETURNS TABLE(available BOOLEAN, remaining INTEGER)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offer RECORD;
BEGIN
  SELECT total_purchased, max_limit, offer_active
  INTO v_offer
  FROM public.lifetime_offer_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    (v_offer.offer_active AND v_offer.total_purchased < v_offer.max_limit) AS available,
    (v_offer.max_limit - v_offer.total_purchased) AS remaining;
END;
$function$
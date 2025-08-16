-- Create lifetime offer tracking table
CREATE TABLE public.lifetime_offer_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  max_limit INTEGER NOT NULL DEFAULT 100,
  offer_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial record
INSERT INTO public.lifetime_offer_tracking (total_purchased, max_limit, offer_active)
VALUES (0, 100, true);

-- Enable RLS
ALTER TABLE public.lifetime_offer_tracking ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the offer status
CREATE POLICY "Everyone can read offer status" 
ON public.lifetime_offer_tracking 
FOR SELECT 
USING (true);

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
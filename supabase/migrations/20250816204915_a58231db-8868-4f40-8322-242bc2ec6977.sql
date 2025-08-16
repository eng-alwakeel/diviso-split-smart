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
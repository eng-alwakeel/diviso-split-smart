-- Create subscription_purchases table
CREATE TABLE public.subscription_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  price_paid NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.subscription_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own subscription purchases"
ON public.subscription_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own purchases
CREATE POLICY "Users can create own subscription purchases"
ON public.subscription_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update (for webhook/payment verification)
CREATE POLICY "Service role can update subscription purchases"
ON public.subscription_purchases
FOR UPDATE
USING (true);

-- Index for faster lookups
CREATE INDEX idx_subscription_purchases_user_id ON public.subscription_purchases(user_id);
CREATE INDEX idx_subscription_purchases_status ON public.subscription_purchases(status);
-- Add auto-renewal fields to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS next_renewal_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS last_payment_status TEXT DEFAULT 'succeeded',
ADD COLUMN IF NOT EXISTS last_payment_failed_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ NULL;

-- Create renewal_reminders table for tracking sent reminders
CREATE TABLE IF NOT EXISTS public.renewal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- '7_days' | '24_hours' | 'grace_period'
  billing_cycle TEXT NOT NULL, -- 'monthly' | 'yearly'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel TEXT NOT NULL, -- 'push' | 'email' | 'in_app'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on renewal_reminders
ALTER TABLE public.renewal_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view their own reminders"
ON public.renewal_reminders
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_user_id ON public.renewal_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_sent_at ON public.renewal_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_renewal ON public.user_subscriptions(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_grace_period ON public.user_subscriptions(grace_period_ends_at);
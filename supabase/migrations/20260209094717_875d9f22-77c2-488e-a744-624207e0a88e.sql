
-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  sent_by UUID REFERENCES public.profiles(id),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Only admins can read campaigns
CREATE POLICY "Admins can view email campaigns"
ON public.email_campaigns
FOR SELECT
USING (public.is_admin_user());

-- Only admins can insert campaigns
CREATE POLICY "Admins can create email campaigns"
ON public.email_campaigns
FOR INSERT
WITH CHECK (public.is_admin_user());

-- Only admins can update campaigns
CREATE POLICY "Admins can update email campaigns"
ON public.email_campaigns
FOR UPDATE
USING (public.is_admin_user());

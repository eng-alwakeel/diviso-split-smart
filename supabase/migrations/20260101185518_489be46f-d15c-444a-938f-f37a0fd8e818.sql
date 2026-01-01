-- Create affiliate_partners table for managing partner APIs
CREATE TABLE public.affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  api_endpoint TEXT,
  api_key_env_name TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('hotels', 'esim', 'car_rental', 'activities', 'restaurants', 'flights', 'general')),
  commission_rate NUMERIC DEFAULT 0,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trip_plans table for complete trip planning
CREATE TABLE public.trip_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  destination TEXT NOT NULL,
  destination_ar TEXT,
  country_code TEXT,
  days INTEGER NOT NULL CHECK (days > 0 AND days <= 30),
  budget TEXT CHECK (budget IN ('low', 'medium', 'high', 'luxury')),
  interests TEXT[] DEFAULT '{}',
  plan_data JSONB NOT NULL DEFAULT '{}',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recommendation_requests table for user requests
CREATE TABLE public.recommendation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('hotel', 'restaurant', 'activity', 'transport', 'esim', 'general')),
  preferences JSONB DEFAULT '{}',
  results JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_requests ENABLE ROW LEVEL SECURITY;

-- RLS for affiliate_partners (public read, admin write)
CREATE POLICY "Anyone can view active partners"
  ON public.affiliate_partners FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage partners"
  ON public.affiliate_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- RLS for trip_plans
CREATE POLICY "Users can view their own plans"
  ON public.trip_plans FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own plans"
  ON public.trip_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.trip_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON public.trip_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for recommendation_requests
CREATE POLICY "Users can view their own requests"
  ON public.recommendation_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create requests"
  ON public.recommendation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.recommendation_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_affiliate_partners_type ON public.affiliate_partners(partner_type);
CREATE INDEX idx_affiliate_partners_active ON public.affiliate_partners(is_active);
CREATE INDEX idx_trip_plans_user ON public.trip_plans(user_id);
CREATE INDEX idx_trip_plans_share_token ON public.trip_plans(share_token);
CREATE INDEX idx_recommendation_requests_user ON public.recommendation_requests(user_id);
CREATE INDEX idx_recommendation_requests_group ON public.recommendation_requests(group_id);

-- Update timestamp trigger
CREATE TRIGGER update_affiliate_partners_updated_at
  BEFORE UPDATE ON public.affiliate_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_plans_updated_at
  BEFORE UPDATE ON public.trip_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- =============================================
-- MONETIZATION CENTER: Phase 1 Database Schema
-- =============================================

-- 1. Ad Types Table
CREATE TABLE IF NOT EXISTS public.ad_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_ar text,
  is_enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Ad Placements Table
CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text NOT NULL,
  allowed_ad_types text[] DEFAULT '{}',
  is_enabled boolean DEFAULT true,
  max_impressions_per_user_day integer DEFAULT 10,
  min_interval_seconds integer DEFAULT 0,
  targeting jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Partner Credentials Table (encrypted secrets)
CREATE TABLE IF NOT EXISTS public.partner_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  auth_type text NOT NULL,
  encrypted_secrets jsonb NOT NULL DEFAULT '{}',
  rate_limit_config jsonb DEFAULT '{}',
  last_rotated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id)
);

-- 4. Partner Endpoints Table
CREATE TABLE IF NOT EXISTS public.partner_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.affiliate_partners(id) ON DELETE CASCADE,
  base_url text NOT NULL,
  sync_endpoint text,
  field_mapping jsonb NOT NULL DEFAULT '{}',
  sync_schedule text DEFAULT 'manual',
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 5. Ad Events Table (detailed event logs)
CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  ad_type text NOT NULL,
  placement text NOT NULL,
  partner_id uuid REFERENCES public.affiliate_partners(id),
  offer_id uuid,
  user_id uuid,
  group_id uuid,
  revenue_amount numeric DEFAULT 0,
  uc_granted integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 6. Outbound Clicks Table (affiliate tracking)
CREATE TABLE IF NOT EXISTS public.outbound_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid,
  offer_id uuid,
  partner_id uuid REFERENCES public.affiliate_partners(id),
  sub_id text,
  destination_url text,
  created_at timestamptz DEFAULT now()
);

-- 7. Conversions Table
CREATE TABLE IF NOT EXISTS public.conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.affiliate_partners(id) NOT NULL,
  sub_id text,
  amount numeric NOT NULL,
  commission numeric NOT NULL,
  currency text DEFAULT 'SAR',
  status text DEFAULT 'pending',
  occurred_at timestamptz NOT NULL,
  raw_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- 8. Metrics Daily Table (aggregated for dashboard performance)
CREATE TABLE IF NOT EXISTS public.metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  ad_type text,
  placement text,
  partner_id uuid,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  uc_granted integer DEFAULT 0,
  no_fill integer DEFAULT 0,
  errors integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, ad_type, placement, partner_id)
);

-- 9. Offers Table (curated + API offers)
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.affiliate_partners(id),
  title text NOT NULL,
  title_ar text,
  description text,
  description_ar text,
  city text,
  category text,
  deeplink text,
  coupon_code text,
  image_url text,
  ends_at timestamptz,
  status text DEFAULT 'active',
  tags jsonb DEFAULT '[]',
  is_featured boolean DEFAULT false,
  source text DEFAULT 'curated',
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. Extend affiliate_partners table
ALTER TABLE public.affiliate_partners
  ADD COLUMN IF NOT EXISTS partner_category text DEFAULT 'affiliate',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS supported_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;

-- =============================================
-- Enable RLS on all new tables
-- =============================================

ALTER TABLE public.ad_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies - Admin only for management tables
-- =============================================

-- Ad Types: Admin read/write
CREATE POLICY "Admins can manage ad_types" ON public.ad_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin'))
  );

CREATE POLICY "Everyone can read enabled ad_types" ON public.ad_types
  FOR SELECT USING (is_enabled = true);

-- Ad Placements: Admin read/write
CREATE POLICY "Admins can manage ad_placements" ON public.ad_placements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin'))
  );

CREATE POLICY "Everyone can read enabled ad_placements" ON public.ad_placements
  FOR SELECT USING (is_enabled = true);

-- Partner Credentials: Admin only (sensitive)
CREATE POLICY "Admins can manage partner_credentials" ON public.partner_credentials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance_admin'))
  );

-- Partner Endpoints: Admin only
CREATE POLICY "Admins can manage partner_endpoints" ON public.partner_endpoints
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance_admin'))
  );

-- Ad Events: Insert for authenticated, read for admins
CREATE POLICY "Users can insert ad_events" ON public.ad_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can read ad_events" ON public.ad_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin', 'analyst'))
  );

-- Outbound Clicks: Insert for authenticated, read for admins
CREATE POLICY "Users can insert outbound_clicks" ON public.outbound_clicks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read outbound_clicks" ON public.outbound_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin', 'analyst'))
  );

-- Conversions: Admin only
CREATE POLICY "Admins can manage conversions" ON public.conversions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance_admin'))
  );

-- Metrics Daily: Admin read
CREATE POLICY "Admins can read metrics_daily" ON public.metrics_daily
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin', 'analyst'))
  );

CREATE POLICY "System can manage metrics_daily" ON public.metrics_daily
  FOR ALL USING (true);

-- Offers: Public read for active, admin write
CREATE POLICY "Everyone can read active offers" ON public.offers
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage offers" ON public.offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'ads_admin', 'finance_admin'))
  );

-- =============================================
-- Insert Default Data
-- =============================================

INSERT INTO public.ad_types (type_key, name, name_ar, description, description_ar, settings) VALUES
  ('rewarded', 'Rewarded Ads', 'إعلانات مكافئة', 'Watch ad to earn UC', 'شاهد إعلان واكسب رصيد', '{"reward_uc": 1, "daily_cap": 5, "cooldown_seconds": 180, "eligibility_rules": {"min_app_opens": 3}}'),
  ('sponsored', 'Sponsored Cards', 'بطاقات برعاية', 'Sponsored recommendation cards', 'بطاقات توصيات برعاية', '{"label_text": "إعلان", "label_text_en": "Ad", "max_density": 3, "ranking_weight": 1.0}'),
  ('native', 'Native Ads', 'إعلانات Native', 'Native ads in feed', 'إعلانات مدمجة في المحتوى', '{"frequency_cap": 10, "min_content_items": 5}'),
  ('banner', 'Banner Ads', 'بانر', 'Static banner ads', 'إعلانات بانر ثابتة', '{"frequency_cap": 20, "refresh_interval_seconds": 60}')
ON CONFLICT (type_key) DO NOTHING;

INSERT INTO public.ad_placements (placement_key, name, name_ar, allowed_ad_types, max_impressions_per_user_day, min_interval_seconds) VALUES
  ('paywall_rewarded', 'Paywall Rewarded', 'شاشة النفاد - مكافئ', ARRAY['rewarded'], 5, 180),
  ('reco_feed_native', 'Recommendations Feed', 'التوصيات - Native', ARRAY['native', 'sponsored'], 20, 0),
  ('settings_banner', 'Settings Banner', 'الإعدادات - بانر', ARRAY['banner'], 10, 60),
  ('reports_banner', 'Reports Banner', 'التقارير - بانر', ARRAY['banner'], 10, 60),
  ('group_reco_sponsored', 'Group Recommendations', 'توصيات القروب', ARRAY['sponsored'], 15, 0)
ON CONFLICT (placement_key) DO NOTHING;

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_ad_events_created_at ON public.ad_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_events_ad_type ON public.ad_events(ad_type);
CREATE INDEX IF NOT EXISTS idx_ad_events_placement ON public.ad_events(placement);
CREATE INDEX IF NOT EXISTS idx_ad_events_partner_id ON public.ad_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_user_id ON public.ad_events(user_id);

CREATE INDEX IF NOT EXISTS idx_outbound_clicks_created_at ON public.outbound_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_partner_id ON public.outbound_clicks(partner_id);

CREATE INDEX IF NOT EXISTS idx_conversions_partner_id ON public.conversions(partner_id);
CREATE INDEX IF NOT EXISTS idx_conversions_occurred_at ON public.conversions(occurred_at);

CREATE INDEX IF NOT EXISTS idx_metrics_daily_date ON public.metrics_daily(date);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_ad_type ON public.metrics_daily(ad_type);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_partner_id ON public.metrics_daily(partner_id);

CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_partner_id ON public.offers(partner_id);
CREATE INDEX IF NOT EXISTS idx_offers_category ON public.offers(category);

-- =============================================
-- Update timestamp triggers
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_types_updated_at
  BEFORE UPDATE ON public.ad_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_placements_updated_at
  BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
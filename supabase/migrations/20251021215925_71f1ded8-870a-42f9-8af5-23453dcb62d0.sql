-- Create social_share_analytics table for tracking social media shares
CREATE TABLE IF NOT EXISTS social_share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'twitter', 'facebook', 'snapchat', 'instagram')),
  action text NOT NULL CHECK (action IN ('shared', 'converted')),
  shared_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  utm_source text,
  device_type text,
  browser text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_social_share_user_id ON social_share_analytics(user_id);
CREATE INDEX idx_social_share_referral_code ON social_share_analytics(referral_code);
CREATE INDEX idx_social_share_platform ON social_share_analytics(platform);
CREATE INDEX idx_social_share_shared_at ON social_share_analytics(shared_at DESC);

-- Enable RLS
ALTER TABLE social_share_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own share analytics"
  ON social_share_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own share analytics"
  ON social_share_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share analytics"
  ON social_share_analytics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE social_share_analytics IS 'Tracks social media sharing and conversion metrics for referral links';
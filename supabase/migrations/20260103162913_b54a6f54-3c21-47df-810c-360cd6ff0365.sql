-- Add location columns to user_recommendation_settings
ALTER TABLE public.user_recommendation_settings
ADD COLUMN IF NOT EXISTS default_city TEXT,
ADD COLUMN IF NOT EXISTS last_location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
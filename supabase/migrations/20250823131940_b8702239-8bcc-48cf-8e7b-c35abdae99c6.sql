-- Create tables for smart ad learning system
CREATE TABLE IF NOT EXISTS public.ad_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_id TEXT NOT NULL,
  ad_category TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'dismiss', 'ignore')),
  context TEXT NOT NULL,
  success_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ad interactions" 
ON public.ad_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad interactions" 
ON public.ad_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create table for enhanced ad profiles
CREATE TABLE IF NOT EXISTS public.user_ad_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_categories TEXT[] DEFAULT '{}',
  avoided_categories TEXT[] DEFAULT '{}',
  best_times TEXT[] DEFAULT '{}',
  successful_placements TEXT[] DEFAULT '{}',
  click_through_rate REAL DEFAULT 0,
  engagement_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ad_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ad profile" 
ON public.user_ad_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad profile" 
ON public.user_ad_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad profile" 
ON public.user_ad_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ad_profiles_updated_at
BEFORE UPDATE ON public.user_ad_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_ad_interactions_user_id ON public.ad_interactions(user_id);
CREATE INDEX idx_ad_interactions_timestamp ON public.ad_interactions(created_at);
CREATE INDEX idx_user_ad_profiles_user_id ON public.user_ad_profiles(user_id);
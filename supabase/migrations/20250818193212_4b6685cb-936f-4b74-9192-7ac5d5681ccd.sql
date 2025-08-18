-- Create ads tracking and affiliate management tables
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ad_type VARCHAR(50) NOT NULL,
  ad_category VARCHAR(100),
  group_id UUID,
  expense_category VARCHAR(100),
  placement VARCHAR(100) NOT NULL,
  impression_count INTEGER DEFAULT 1,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  revenue_amount DECIMAL(10,4) DEFAULT 0,
  affiliate_partner VARCHAR(50) DEFAULT 'amazon',
  product_id VARCHAR(255),
  user_location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Create policies for ad impressions
CREATE POLICY "Users can view their own ad impressions" 
ON public.ad_impressions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ad impressions" 
ON public.ad_impressions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad impressions" 
ON public.ad_impressions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user ad preferences table
CREATE TABLE public.user_ad_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  show_ads BOOLEAN DEFAULT TRUE,
  preferred_categories TEXT[],
  blocked_categories TEXT[],
  max_ads_per_session INTEGER DEFAULT 3,
  personalized_ads BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ad_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for ad preferences
CREATE POLICY "Users can view their own ad preferences" 
ON public.user_ad_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad preferences" 
ON public.user_ad_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create affiliate product recommendations table
CREATE TABLE public.affiliate_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  affiliate_partner VARCHAR(50) NOT NULL DEFAULT 'amazon',
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  price_range VARCHAR(50),
  rating DECIMAL(3,2),
  image_url VARCHAR(500),
  affiliate_url VARCHAR(1000) NOT NULL,
  keywords TEXT[],
  target_audience VARCHAR(100),
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  commission_rate DECIMAL(5,4) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for public read access
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate products are viewable by authenticated users" 
ON public.affiliate_products 
FOR SELECT 
USING (auth.role() = 'authenticated' AND active = TRUE);

-- Create indexes for performance
CREATE INDEX idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_category ON public.ad_impressions(ad_category);
CREATE INDEX idx_ad_impressions_created_at ON public.ad_impressions(created_at);
CREATE INDEX idx_affiliate_products_category ON public.affiliate_products(category);
CREATE INDEX idx_affiliate_products_keywords ON public.affiliate_products USING GIN(keywords);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ad_impressions_updated_at
  BEFORE UPDATE ON public.ad_impressions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ad_preferences_updated_at
  BEFORE UPDATE ON public.user_ad_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_products_updated_at
  BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
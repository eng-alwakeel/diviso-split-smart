-- Create table for KPI targets
CREATE TABLE public.admin_kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name TEXT NOT NULL UNIQUE,
  target_value NUMERIC NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'minimum' CHECK (target_type IN ('minimum', 'maximum', 'exact')),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  description TEXT,
  description_ar TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_kpi_targets ENABLE ROW LEVEL SECURITY;

-- Only admins can view targets
CREATE POLICY "Admins can view KPI targets"
ON public.admin_kpi_targets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Only admins can manage targets
CREATE POLICY "Admins can manage KPI targets"
ON public.admin_kpi_targets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Insert default KPI targets
INSERT INTO public.admin_kpi_targets (kpi_name, target_value, target_type, period, description, description_ar) VALUES
('dau', 500, 'minimum', 'daily', 'Daily Active Users', 'المستخدمون النشطون يومياً'),
('mau', 5000, 'minimum', 'monthly', 'Monthly Active Users', 'المستخدمون النشطون شهرياً'),
('stickiness', 25, 'minimum', 'monthly', 'DAU/MAU Ratio', 'معدل الالتصاق'),
('d7_retention', 25, 'minimum', 'weekly', 'D7 Retention Rate', 'معدل الاحتفاظ بعد 7 أيام'),
('monthly_revenue', 50000, 'minimum', 'monthly', 'Monthly Revenue in SAR', 'الإيرادات الشهرية'),
('paywall_conversion', 8, 'minimum', 'monthly', 'Paywall Conversion Rate', 'معدل تحويل Paywall'),
('churn_rate', 5, 'maximum', 'monthly', 'Monthly Churn Rate', 'معدل الإلغاء الشهري'),
('new_users', 100, 'minimum', 'daily', 'New User Signups', 'التسجيلات الجديدة يومياً');
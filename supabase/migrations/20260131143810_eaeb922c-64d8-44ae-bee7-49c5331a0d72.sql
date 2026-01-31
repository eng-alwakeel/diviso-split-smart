-- جدول لتتبع جلسات التجربة (Guest Mode)
CREATE TABLE public.demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  scenarios_tried TEXT[] DEFAULT '{}',
  expenses_count INTEGER DEFAULT 0,
  groups_created INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  device_type TEXT,
  utm_source TEXT,
  utm_campaign TEXT
);

-- RLS: يمكن الإدراج من الجميع (anonymous)، لا يمكن القراءة
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo sessions" ON public.demo_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can insert demo sessions" ON public.demo_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own demo session" ON public.demo_sessions
  FOR UPDATE USING (session_id = session_id);

-- Index للتحليلات
CREATE INDEX idx_demo_sessions_created ON public.demo_sessions(created_at);
CREATE INDEX idx_demo_sessions_session_id ON public.demo_sessions(session_id);

-- دالة للحصول على إحصائيات التجارب الحقيقية
CREATE OR REPLACE FUNCTION public.get_demo_stats()
RETURNS JSON AS $$
DECLARE
  v_today_count INTEGER;
  v_24h_count INTEGER;
  v_most_tried TEXT;
BEGIN
  -- تجارب اليوم
  SELECT COUNT(*) INTO v_today_count
  FROM public.demo_sessions
  WHERE created_at >= CURRENT_DATE;
  
  -- تجارب آخر 24 ساعة
  SELECT COUNT(*) INTO v_24h_count
  FROM public.demo_sessions
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- أكثر سيناريو مجرّب
  SELECT scenario INTO v_most_tried
  FROM (
    SELECT unnest(scenarios_tried) as scenario
    FROM public.demo_sessions
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  ) sub
  GROUP BY scenario
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN json_build_object(
    'today_count', COALESCE(v_today_count, 0),
    'last_24h_count', COALESCE(v_24h_count, 0),
    'most_tried_scenario', COALESCE(v_most_tried, 'travel')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- منح صلاحية التنفيذ للجميع
GRANT EXECUTE ON FUNCTION public.get_demo_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_demo_stats() TO authenticated;
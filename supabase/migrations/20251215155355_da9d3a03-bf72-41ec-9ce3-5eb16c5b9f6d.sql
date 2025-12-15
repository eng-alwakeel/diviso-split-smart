-- إضافة أعمدة العملات لجدول user_streaks
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins_spent INTEGER DEFAULT 0;

-- تحديث القيم الموجودة
UPDATE public.user_streaks SET coins = points WHERE coins = 0 AND points > 0;

-- إنشاء جدول أنواع المكافآت
CREATE TABLE public.reward_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coins', 'badge', 'soft_unlock', 'insight', 'boost')),
  value JSONB NOT NULL DEFAULT '{}',
  icon TEXT,
  description_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الفتح المؤقت للمزايا
CREATE TABLE public.temporary_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('advanced_analytics', 'ai_insight', 'template', 'ocr_boost', 'export')),
  restrictions JSONB DEFAULT '{}',
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('daily_reward', 'weekly_reward', 'coin_purchase', 'referral', 'promo')),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول معاملات العملات
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent')),
  source TEXT NOT NULL,
  description_ar TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_temporary_unlocks_user_id ON public.temporary_unlocks(user_id);
CREATE INDEX idx_temporary_unlocks_expires_at ON public.temporary_unlocks(expires_at);
CREATE INDEX idx_temporary_unlocks_feature_type ON public.temporary_unlocks(feature_type);
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions(created_at);

-- تفعيل RLS
ALTER TABLE public.reward_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- سياسات reward_types (قراءة للجميع)
CREATE POLICY "Anyone can read reward types" ON public.reward_types
  FOR SELECT USING (true);

-- سياسات temporary_unlocks
CREATE POLICY "Users can view their own unlocks" ON public.temporary_unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocks" ON public.temporary_unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocks" ON public.temporary_unlocks
  FOR UPDATE USING (auth.uid() = user_id);

-- سياسات coin_transactions
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.coin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- إدراج أنواع المكافآت الأساسية
INSERT INTO public.reward_types (name, name_ar, type, value, icon, description_ar) VALUES
('daily_coins_5', 'عملات يومية', 'coins', '{"amount": 5}', 'Coins', '5 عملات Diviso'),
('daily_coins_10', 'عملات يومية', 'coins', '{"amount": 10}', 'Coins', '10 عملات Diviso'),
('daily_coins_15', 'عملات يومية', 'coins', '{"amount": 15}', 'Coins', '15 عملات Diviso'),
('daily_coins_20', 'عملات يومية', 'coins', '{"amount": 20}', 'Coins', '20 عملات Diviso'),
('daily_coins_25', 'عملات يومية', 'coins', '{"amount": 25}', 'Coins', '25 عملات Diviso'),
('weekly_bonus', 'مكافأة الأسبوع', 'coins', '{"amount": 30}', 'Gift', 'مكافأة إكمال الأسبوع'),
('badge_starter', 'شارة البداية', 'badge', '{"badge_id": "starter"}', 'Star', 'شارة أول يوم'),
('badge_enthusiast', 'شارة متحمس', 'badge', '{"badge_id": "enthusiast"}', 'Flame', 'شارة 3 أيام'),
('badge_champion', 'شارة البطل', 'badge', '{"badge_id": "champion"}', 'Trophy', 'شارة إكمال الأسبوع'),
('ai_insight_free', 'تحليل ذكي', 'insight', '{"count": 1, "duration_days": 7}', 'Sparkles', 'تحليل AI مجاني واحد'),
('analytics_preview', 'تحليلات متقدمة', 'soft_unlock', '{"feature": "advanced_analytics", "duration_days": 3, "read_only": true}', 'BarChart', 'معاينة التحليلات المتقدمة'),
('ocr_boost', 'رفع حد OCR', 'boost', '{"feature": "ocr", "boost_amount": 5, "duration_days": 1}', 'Camera', 'رفع حد مسح الإيصالات ليوم');

-- دالة لإضافة عملات
CREATE OR REPLACE FUNCTION public.add_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description_ar TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- تحديث رصيد العملات
  INSERT INTO user_streaks (user_id, coins, total_coins_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    coins = user_streaks.coins + p_amount,
    total_coins_earned = user_streaks.total_coins_earned + p_amount,
    updated_at = now();

  -- الحصول على الرصيد الجديد
  SELECT coins INTO v_new_balance FROM user_streaks WHERE user_id = p_user_id;

  -- تسجيل المعاملة
  INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description_ar)
  VALUES (p_user_id, p_amount, 'earned', p_source, p_description_ar);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$;

-- دالة لصرف عملات
CREATE OR REPLACE FUNCTION public.spend_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description_ar TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- التحقق من الرصيد
  SELECT coins INTO v_current_balance FROM user_streaks WHERE user_id = p_user_id;
  
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'current_balance', COALESCE(v_current_balance, 0),
      'required', p_amount
    );
  END IF;

  -- خصم العملات
  UPDATE user_streaks SET
    coins = coins - p_amount,
    total_coins_spent = total_coins_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- الحصول على الرصيد الجديد
  SELECT coins INTO v_new_balance FROM user_streaks WHERE user_id = p_user_id;

  -- تسجيل المعاملة
  INSERT INTO coin_transactions (user_id, amount, transaction_type, source, description_ar)
  VALUES (p_user_id, p_amount, 'spent', p_source, p_description_ar);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'amount_spent', p_amount
  );
END;
$$;

-- دالة لمنح فتح مؤقت
CREATE OR REPLACE FUNCTION public.grant_temporary_unlock(
  p_user_id UUID,
  p_feature_type TEXT,
  p_duration_days INTEGER,
  p_source TEXT,
  p_restrictions JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unlock_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_expires_at := now() + (p_duration_days || ' days')::interval;

  INSERT INTO temporary_unlocks (user_id, feature_type, restrictions, expires_at, source)
  VALUES (p_user_id, p_feature_type, p_restrictions, v_expires_at, p_source)
  RETURNING id INTO v_unlock_id;

  RETURN jsonb_build_object(
    'success', true,
    'unlock_id', v_unlock_id,
    'feature_type', p_feature_type,
    'expires_at', v_expires_at
  );
END;
$$;
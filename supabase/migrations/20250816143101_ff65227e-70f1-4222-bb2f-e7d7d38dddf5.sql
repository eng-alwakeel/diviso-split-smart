-- إنشاء جدول رموز الإحالة لكل مستخدم
CREATE TABLE public.user_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS على جدول رموز الإحالة
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول رموز الإحالة
CREATE POLICY "Users can read their own referral code" 
ON public.user_referral_codes 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own referral code" 
ON public.user_referral_codes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own referral code" 
ON public.user_referral_codes 
FOR UPDATE 
USING (user_id = auth.uid());

-- إضافة حقول جديدة لجدول الإحالات الحالي
ALTER TABLE public.referrals 
ADD COLUMN referral_code TEXT,
ADD COLUMN invitee_name TEXT,
ADD COLUMN reward_days INTEGER DEFAULT 7;

-- إنشاء جدول مكافآت الإحالة (الأيام المجانية)
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referral_id UUID NOT NULL,
  days_earned INTEGER NOT NULL DEFAULT 7,
  applied_to_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- تمكين RLS على جدول مكافآت الإحالة
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول مكافآت الإحالة
CREATE POLICY "Users can read their own referral rewards" 
ON public.referral_rewards 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own referral rewards" 
ON public.referral_rewards 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own referral rewards" 
ON public.referral_rewards 
FOR UPDATE 
USING (user_id = auth.uid());

-- دالة لتوليد رمز إحالة فريد
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    -- توليد رمز من 8 أحرف وأرقام
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- التأكد من عدم وجود الرمز مسبقاً
    IF NOT EXISTS (SELECT 1 FROM public.user_referral_codes WHERE referral_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- دالة لإنشاء رمز إحالة تلقائياً للمستخدمين الجدد
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_referral_codes (user_id, referral_code)
  VALUES (NEW.id, public.generate_referral_code());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لإنشاء رمز إحالة تلقائياً عند إنشاء ملف تعريف جديد
CREATE TRIGGER create_referral_code_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_referral_code();

-- دالة لمعالجة مكافآت الإحالة الناجحة
CREATE OR REPLACE FUNCTION public.process_successful_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم تحديث الحالة إلى 'joined'
  IF OLD.status != 'joined' AND NEW.status = 'joined' THEN
    -- إضافة مكافأة للمُحيل
    INSERT INTO public.referral_rewards (user_id, referral_id, days_earned)
    VALUES (NEW.inviter_id, NEW.id, NEW.reward_days);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger لمعالجة المكافآت عند نجاح الإحالة
CREATE TRIGGER process_referral_rewards
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.process_successful_referral();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_user_referral_codes_user_id ON public.user_referral_codes(user_id);
CREATE INDEX idx_user_referral_codes_code ON public.user_referral_codes(referral_code);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_referral_rewards_user_id ON public.referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_applied ON public.referral_rewards(applied_to_subscription);
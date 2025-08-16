-- إضافة حقول جديدة لجدول الإحالات الحالي (إذا لم تكن موجودة)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referral_code') THEN
    ALTER TABLE public.referrals ADD COLUMN referral_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'invitee_name') THEN
    ALTER TABLE public.referrals ADD COLUMN invitee_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_days') THEN
    ALTER TABLE public.referrals ADD COLUMN reward_days INTEGER DEFAULT 7;
  END IF;
END $$;

-- إنشاء جدول مكافآت الإحالة (الأيام المجانية) إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.referral_rewards (
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

-- حذف السياسات الموجودة إذا كانت موجودة ثم إعادة إنشائها
DROP POLICY IF EXISTS "Users can read their own referral rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS "Users can insert their own referral rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS "Users can update their own referral rewards" ON public.referral_rewards;

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
  -- التأكد من عدم وجود رمز إحالة مسبقاً لهذا المستخدم
  IF NOT EXISTS (SELECT 1 FROM public.user_referral_codes WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_referral_codes (user_id, referral_code)
    VALUES (NEW.id, public.generate_referral_code());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف الـ trigger الموجود وإعادة إنشاؤه
DROP TRIGGER IF EXISTS create_referral_code_on_profile_creation ON public.profiles;

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

-- حذف الـ trigger الموجود وإعادة إنشاؤه
DROP TRIGGER IF EXISTS process_referral_rewards ON public.referrals;

-- إنشاء trigger لمعالجة المكافآت عند نجاح الإحالة
CREATE TRIGGER process_referral_rewards
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.process_successful_referral();

-- إنشاء فهارس لتحسين الأداء (إذا لم تكن موجودة)
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON public.referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_applied ON public.referral_rewards(applied_to_subscription);

-- إنشاء رموز إحالة للمستخدمين الحاليين الذين لا يملكون رموز
INSERT INTO public.user_referral_codes (user_id, referral_code)
SELECT p.id, public.generate_referral_code()
FROM public.profiles p
LEFT JOIN public.user_referral_codes urc ON urc.user_id = p.id
WHERE urc.user_id IS NULL;
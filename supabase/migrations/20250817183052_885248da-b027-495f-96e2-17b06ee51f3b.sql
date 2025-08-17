-- إضافة trigger لإنشاء رموز الإحالة تلقائياً للمستخدمين الجدد
CREATE TRIGGER create_referral_code_on_user_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_user_referral_code();
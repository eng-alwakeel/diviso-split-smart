import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReferralData {
  id: string;
  invitee_name: string | null;
  invitee_phone: string;
  status: "pending" | "joined" | "expired" | "blocked";
  joined_at: string | null;
  created_at: string;
  reward_days: number | null;
}

export interface UserReferralCode {
  referral_code: string;
  user_id: string;
}

export function useReferrals() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);

  const fetchReferralCode = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_referral_codes")
        .select("referral_code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setReferralCode(data?.referral_code || null);
    } catch (error) {
      console.error("Error fetching referral code:", error);
    }
  }, []);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReferrals([]);
        setTotalReferrals(0);
        setSuccessfulReferrals(0);
        return;
      }

      // تحديث الإحالات المنتهية الصلاحية أولاً
      await supabase.rpc('update_expired_referrals');

      // جلب الإحصائيات المحدثة
      const { data: stats, error: statsError } = await supabase.rpc('get_referral_stats', {
        p_user_id: user.id
      });

      if (statsError) {
        console.warn("Warning getting referral stats:", statsError);
      }

      // جلب بيانات الإحالات
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      
      if (stats && stats.length > 0) {
        const stat = stats[0];
        setTotalReferrals(stat.total_referrals);
        setSuccessfulReferrals(stat.successful_referrals);
      } else {
        // fallback للحساب اليدوي
        const totalCount = data?.length || 0;
        const successfulCount = data?.filter(ref => ref.status === 'joined').length || 0;
        setTotalReferrals(totalCount);
        setSuccessfulReferrals(successfulCount);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("خطأ في جلب بيانات الإحالات");
      // تعيين قيم افتراضية في حالة الخطأ
      setReferrals([]);
      setTotalReferrals(0);
      setSuccessfulReferrals(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReferralInvite = useCallback(async (phone: string, name?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return { success: false, error: "not_authenticated" };
      }

      if (!referralCode) {
        toast.error("رمز الإحالة غير متوفر");
        return { success: false, error: "no_referral_code" };
      }

      // التحقق من صحة رقم الهاتف السعودي مع دعم المزيد من الأشكال
      const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
      const phoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;
      
      if (!phoneRegex.test(cleanPhone)) {
        toast.error("يرجى إدخال رقم هاتف سعودي صحيح (مثال: 05xxxxxxxx)");
        return { success: false, error: "invalid_phone" };
      }

      // تنسيق رقم الهاتف بشكل موحد
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+966' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('966')) {
        formattedPhone = '+' + formattedPhone;
      } else if (!formattedPhone.startsWith('+966')) {
        formattedPhone = '+966' + formattedPhone;
      }

      // التحقق من الحماية ضد spam
      const { data: spamCheck, error: spamError } = await supabase.rpc('check_referral_spam_protection', {
        p_user_id: user.id,
        p_phone: formattedPhone
      });

      if (spamError) {
        console.error("Error checking spam protection:", spamError);
        toast.error("خطأ في التحقق من الحماية");
        return { success: false, error: "spam_check_failed" };
      }

      if (spamCheck && spamCheck.length > 0 && !spamCheck[0].is_allowed) {
        toast.error(spamCheck[0].reason);
        return { success: false, error: "blocked_by_spam_protection" };
      }

      // التحقق من وجود إحالة نشطة أو معلقة مسبقة
      const { data: existingReferrals, error: checkError } = await supabase
        .from("referrals")
        .select("id, status, created_at")
        .eq("inviter_id", user.id)
        .eq("invitee_phone", formattedPhone)
        .in("status", ["pending", "joined"]);

      if (checkError) {
        console.error("Error checking existing referrals:", checkError);
        toast.error("خطأ في التحقق من الإحالات السابقة");
        return { success: false, error: checkError.message };
      }

      if (existingReferrals && existingReferrals.length > 0) {
        const activeReferral = existingReferrals[0];
        if (activeReferral.status === 'joined') {
          toast.error("هذا الرقم منضم بالفعل عبر إحالتك");
        } else {
          toast.error("يوجد إحالة معلقة لهذا الرقم مسبقاً");
        }
        return { success: false, error: "referral_exists" };
      }

      // الحصول على المستوى الحالي للمستخدم
      const { data: tierData } = await supabase.rpc('get_user_referral_tier', {
        p_user_id: user.id
      });

      const currentTier = tierData && tierData.length > 0 ? tierData[0] : null;

      // إنشاء سجل إحالة في قاعدة البيانات
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .insert({
          inviter_id: user.id,
          invitee_phone: formattedPhone,
          invitee_name: name?.trim() || null,
          referral_code: referralCode,
          status: "pending",
          reward_days: 7, // سيتم تطبيق المضاعف لاحقاً عند النجاح
          referral_source: "manual",
          tier_at_time: currentTier?.tier_name || "المبتدئ",
          original_reward_days: 7,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (referralError) {
        console.error("Error creating referral:", referralError);
        if (referralError.code === '23505') {
          toast.error("يوجد إحالة لهذا الرقم مسبقاً");
        } else {
          toast.error("خطأ في إنشاء الإحالة");
        }
        return { success: false, error: referralError.message };
      }

      // إرسال رسالة SMS
      try {
        const { data: smsData, error: smsError } = await supabase.functions.invoke(
          'send-referral-invite',
          {
            body: {
              phone: formattedPhone,
              senderName: name?.trim() || user.user_metadata?.display_name || user.user_metadata?.name || 'صديقك',
              referralCode
            }
          }
        );

        if (smsError) {
          console.error("SMS sending failed:", smsError);
          toast.success("تم إنشاء الإحالة بنجاح (الرسالة قيد الإرسال)");
        } else {
          toast.success(`تم إرسال دعوة الإحالة إلى ${formattedPhone}`);
        }
      } catch (smsError) {
        console.error("SMS service error:", smsError);
        toast.success("تم إنشاء الإحالة بنجاح (سيتم إرسال الرسالة لاحقاً)");
      }

      // تسجيل مصدر الإحالة
      try {
        await supabase
          .from("referral_sources")
          .insert({
            referral_id: referralData.id,
            source_type: "sms",
            source_details: {
              method: "manual",
              has_name: !!name?.trim()
            }
          });
      } catch (sourceError) {
        console.error("Error logging referral source:", sourceError);
        // لا نوقف العملية بسبب خطأ في التتبع
      }

      // تحديث قائمة الإحالات
      await fetchReferrals();
      
      return { success: true, data: referralData };
    } catch (error) {
      console.error("Error in sendReferralInvite:", error);
      toast.error("خطأ غير متوقع في إرسال الإحالة");
      return { success: false, error: (error as Error).message };
    }
  }, [referralCode, fetchReferrals]);

  const getReferralLink = useCallback(() => {
    if (!referralCode) return null;
    return `${window.location.origin}/join/${referralCode}`;
  }, [referralCode]);

  const getSuccessRate = useCallback(() => {
    if (totalReferrals === 0) return 0;
    return Math.round((successfulReferrals / totalReferrals) * 100);
  }, [totalReferrals, successfulReferrals]);

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
  }, [fetchReferralCode, fetchReferrals]);

  return {
    referrals,
    referralCode,
    loading,
    totalReferrals,
    successfulReferrals,
    sendReferralInvite,
    getReferralLink,
    getSuccessRate,
    refresh: () => {
      fetchReferralCode();
      fetchReferrals();
    }
  };
}
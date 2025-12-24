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
  referral_source?: string | null;
  group_id?: string | null;
  group_name?: string | null;
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

      // جلب بيانات الإحالات الموحدة (الشخصية + دعوات المجموعات)
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // تحويل البيانات لتشمل معلومات المصدر
      const unifiedReferrals: ReferralData[] = (data || []).map(ref => ({
        id: ref.id,
        invitee_name: ref.invitee_name,
        invitee_phone: ref.invitee_phone,
        status: ref.status as ReferralData['status'],
        joined_at: ref.joined_at,
        created_at: ref.created_at,
        reward_days: ref.reward_days,
        referral_source: ref.referral_source,
        group_id: ref.group_id,
        group_name: ref.group_name
      }));

      setReferrals(unifiedReferrals);
      
      if (stats && stats.length > 0) {
        const stat = stats[0];
        setTotalReferrals(stat.total_referrals);
        setSuccessfulReferrals(stat.successful_referrals);
      } else {
        // fallback للحساب اليدوي
        const totalCount = unifiedReferrals.length;
        const successfulCount = unifiedReferrals.filter(ref => ref.status === 'joined').length;
        setTotalReferrals(totalCount);
        setSuccessfulReferrals(successfulCount);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("خطأ في جلب بيانات الإحالات");
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

      if (spamCheck && !(spamCheck as any).is_allowed) {
        toast.error((spamCheck as any).reason);
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
      
      // جلب معلومات المستوى الكاملة للحصول على المضاعف
      let bonusMultiplier = 1;
      if (currentTier?.tier_name) {
        const { data: tierDetails } = await supabase
          .from('referral_tiers')
          .select('bonus_multiplier')
          .eq('tier_name', currentTier.tier_name)
          .single();
        
        bonusMultiplier = tierDetails?.bonus_multiplier || 1;
      }
      
      // حساب المكافأة مع تطبيق المضاعف
      const baseRewardDays = 7;
      const finalRewardDays = Math.floor(baseRewardDays * bonusMultiplier);

      console.log(`Creating referral with tier bonus: ${currentTier?.tier_name || 'المبتدئ'} (${bonusMultiplier}x) = ${finalRewardDays} days`);

      // إنشاء سجل إحالة في قاعدة البيانات
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .insert({
          inviter_id: user.id,
          invitee_phone: formattedPhone,
          invitee_name: name?.trim() || null,
          referral_code: referralCode,
          status: "pending",
          reward_days: finalRewardDays,
          referral_source: "manual",
          tier_at_time: currentTier?.tier_name || "المبتدئ",
          original_reward_days: baseRewardDays,
          bonus_applied: bonusMultiplier > 1,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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

  // Get statistics by source
  const getStatsBySource = useCallback(() => {
    const personal = referrals.filter(r => r.referral_source === 'manual' || !r.referral_source);
    const group = referrals.filter(r => r.referral_source === 'group_invite');
    
    return {
      personal: {
        total: personal.length,
        joined: personal.filter(r => r.status === 'joined').length,
        pending: personal.filter(r => r.status === 'pending').length,
        rewardDays: personal.reduce((sum, r) => sum + (r.status === 'joined' ? (r.reward_days || 0) : 0), 0)
      },
      group: {
        total: group.length,
        joined: group.filter(r => r.status === 'joined').length,
        pending: group.filter(r => r.status === 'pending').length,
        rewardDays: group.reduce((sum, r) => sum + (r.status === 'joined' ? (r.reward_days || 0) : 0), 0)
      }
    };
  }, [referrals]);

  // إعادة إرسال دعوة الإحالة
  const resendReferralInvite = useCallback(async (referralId: string) => {
    try {
      const referral = referrals.find(r => r.id === referralId);
      if (!referral) {
        toast.error("الإحالة غير موجودة");
        return { success: false };
      }

      if (referral.status !== 'pending') {
        toast.error("لا يمكن إعادة إرسال إحالة غير معلقة");
        return { success: false };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return { success: false };
      }

      const { data, error } = await supabase.functions.invoke('send-referral-invite', {
        body: {
          phone: referral.invitee_phone,
          senderName: referral.invitee_name || user.user_metadata?.display_name || 'صديقك',
          referralCode
        }
      });

      if (error) {
        console.error("Error resending referral:", error);
        toast.error("فشل في إعادة إرسال الدعوة");
        return { success: false };
      }

      toast.success("تم إعادة إرسال الدعوة بنجاح");
      return { success: true };
    } catch (error) {
      console.error("Error in resendReferralInvite:", error);
      toast.error("خطأ في إعادة إرسال الدعوة");
      return { success: false };
    }
  }, [referrals, referralCode]);

  // تحديث بيانات الإحالة
  const updateReferral = useCallback(async (referralId: string, data: { invitee_name?: string }) => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update(data)
        .eq('id', referralId);

      if (error) {
        console.error("Error updating referral:", error);
        toast.error("فشل في تحديث الإحالة");
        return { success: false };
      }

      toast.success("تم تحديث الإحالة بنجاح");
      await fetchReferrals();
      return { success: true };
    } catch (error) {
      console.error("Error in updateReferral:", error);
      toast.error("خطأ في تحديث الإحالة");
      return { success: false };
    }
  }, [fetchReferrals]);

  // حذف الإحالة
  const deleteReferral = useCallback(async (referralId: string) => {
    try {
      const referral = referrals.find(r => r.id === referralId);
      if (!referral) {
        toast.error("الإحالة غير موجودة");
        return { success: false };
      }

      if (referral.status === 'joined') {
        toast.error("لا يمكن حذف إحالة منضمة");
        return { success: false };
      }

      const { error } = await supabase
        .from('referrals')
        .delete()
        .eq('id', referralId);

      if (error) {
        console.error("Error deleting referral:", error);
        toast.error("فشل في حذف الإحالة");
        return { success: false };
      }

      toast.success("تم حذف الإحالة بنجاح");
      await fetchReferrals();
      return { success: true };
    } catch (error) {
      console.error("Error in deleteReferral:", error);
      toast.error("خطأ في حذف الإحالة");
      return { success: false };
    }
  }, [referrals, fetchReferrals]);

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
    resendReferralInvite,
    updateReferral,
    deleteReferral,
    getReferralLink,
    getSuccessRate,
    getStatsBySource,
    refresh: () => {
      fetchReferralCode();
      fetchReferrals();
    }
  };
}

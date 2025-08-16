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
      if (!user) return;

      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      setTotalReferrals(data?.length || 0);
      setSuccessfulReferrals(data?.filter(r => r.status === "joined").length || 0);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("خطأ في جلب بيانات الإحالات");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReferralInvite = useCallback(async (phone: string, name?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return { error: "not_authenticated" };
      }

      if (!referralCode) {
        toast.error("رمز الإحالة غير متوفر");
        return { error: "no_referral_code" };
      }

      // Validate Saudi phone number format
      const phoneRegex = /^05\d{8}$/;
      if (!phoneRegex.test(phone)) {
        toast.error("يرجى إدخال رقم جوال سعودي صحيح (05xxxxxxxx)");
        return { error: "invalid_phone_format" };
      }

      // Check if phone is already invited (only active invitations)
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id, expires_at")
        .eq("inviter_id", user.id)
        .eq("invitee_phone", phone)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (existingReferral) {
        toast.error("تم إرسال دعوة لهذا الرقم مسبقاً والدعوة لا تزال سارية");
        return { error: "already_invited" };
      }

      // Insert referral record first
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .insert({
          inviter_id: user.id,
          invitee_phone: phone,
          invitee_name: name || null,
          referral_code: referralCode,
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select()
        .single();

      if (referralError) {
        console.error("Database error:", referralError);
        toast.error("خطأ في حفظ بيانات الإحالة");
        return { error: "database_error" };
      }

      console.log("Referral record created:", referralData);

      // Send SMS invite
      const { data: smsData, error: smsError } = await supabase.functions.invoke('send-referral-invite', {
        body: {
          phone,
          senderName: user.user_metadata?.display_name || user.user_metadata?.name || "صديقك",
          referralCode
        }
      });

      if (smsError) {
        console.error("SMS error:", smsError);
        // Update referral status to indicate SMS failure but keep the record
        await supabase
          .from("referrals")
          .update({ 
            status: "pending" // Keep as pending since the record exists
          })
          .eq("id", referralData.id);
        
        toast.error("تم حفظ الدعوة ولكن فشل إرسال الرسالة النصية");
        return { error: "sms_failed", data: referralData };
      }

      console.log("SMS sent successfully:", smsData);
      toast.success("تم إرسال الدعوة بنجاح!");
      
      // Refresh referrals to show the new one
      await fetchReferrals();
      
      return { success: true, data: referralData };
    } catch (error) {
      console.error("Error sending referral invite:", error);
      toast.error("حدث خطأ غير متوقع أثناء إرسال الدعوة");
      return { error: (error as Error).message };
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
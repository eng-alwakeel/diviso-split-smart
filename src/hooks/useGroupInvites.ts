import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BRAND_CONFIG } from "@/lib/brandConfig";

export interface GroupInvite {
  id: string;
  group_id: string;
  phone_or_email: string;
  invited_role: "owner" | "admin" | "member";
  status: "pending" | "sent" | "accepted" | "revoked" | "expired";
  created_at: string;
  created_by: string;
  referral_id?: string | null;
}

export function useGroupInvites(groupId?: string) {
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast.error("خطأ في جلب الدعوات");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const sendInvite = useCallback(async (
    phoneOrEmail: string, 
    role: "owner" | "admin" | "member" = "member",
    groupName?: string,
    method: "smart" | "sms" | "email" = "smart"
  ) => {
    if (!groupId) {
      toast.error("معرف المجموعة مطلوب");
      return { error: "no_group_id" };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return { error: "not_authenticated" };
      }

      // Check if already invited
      const { data: existingInvite } = await supabase
        .from("invites")
        .select("id")
        .eq("group_id", groupId)
        .eq("phone_or_email", phoneOrEmail)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        toast.error("تم إرسال دعوة لهذا الشخص مسبقاً");
        return { error: "already_invited" };
      }

      // Determine if it's phone or email
      const isPhone = /^[\+]?[\d\s\-\(\)]+$/.test(phoneOrEmail);
      
      // Format phone for referral system
      let formattedPhone = phoneOrEmail;
      if (isPhone) {
        formattedPhone = phoneOrEmail.replace(/\s+/g, '').replace(/-/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+966' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('966')) {
          formattedPhone = '+' + formattedPhone;
        } else if (!formattedPhone.startsWith('+966') && !formattedPhone.startsWith('+')) {
          formattedPhone = '+966' + formattedPhone;
        }
      }

      // Get user's referral code for creating referral record
      const { data: referralCodeData } = await supabase
        .from("user_referral_codes")
        .select("referral_code")
        .eq("user_id", user.id)
        .maybeSingle();

      // مكافأة ثابتة 7 أيام - بدون نظام المستويات
      const rewardDays = 7;

      // Create referral record for group invite (to track and reward)
      let referralId: string | null = null;
      
      if (isPhone && referralCodeData?.referral_code) {
        // Check if referral already exists
        const { data: existingReferral } = await supabase
          .from("referrals")
          .select("id")
          .eq("inviter_id", user.id)
          .eq("invitee_phone", formattedPhone)
          .in("status", ["pending", "joined"])
          .maybeSingle();

        if (!existingReferral) {
          // Create new referral linked to group invite
          const { data: newReferral, error: referralError } = await supabase
            .from("referrals")
            .insert({
              inviter_id: user.id,
              invitee_phone: formattedPhone,
              invitee_name: null,
              referral_code: referralCodeData.referral_code,
              status: "pending",
              reward_days: rewardDays,
              referral_source: "group_invite",
              group_id: groupId,
              group_name: groupName || "المجموعة",
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select("id")
            .single();

          if (!referralError && newReferral) {
            referralId = newReferral.id;
            console.log(`Created referral record for group invite: ${referralId}`);
          } else {
            console.error("Error creating referral for group invite:", referralError);
          }
        } else {
          referralId = existingReferral.id;
        }
      }

      // Create invite with referral link
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .insert({
          group_id: groupId,
          phone_or_email: phoneOrEmail,
          invited_role: role,
          created_by: user.id,
          status: "pending",
          referral_id: referralId
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phoneOrEmail);
      
      // Send based on method and type
      if (method === "smart" && isPhone) {
        const { error: smartError } = await supabase.functions.invoke('smart-invite', {
          body: {
            groupId,
            phoneNumber: phoneOrEmail,
            groupName: groupName || "المجموعة",
            senderName: user.user_metadata?.name || "صديقك"
          }
        });

        if (smartError) {
          console.error("Smart invite error:", smartError);
        }
      } else if (method === "sms" && isPhone) {
        // إنشاء group_join_token للرابط الصحيح
        const { data: tokenData } = await supabase.rpc('create_group_join_token', {
          p_group_id: groupId,
          p_role: role,
          p_link_type: 'sms_invite'
        });
        const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
        const token = typeof tokenObj === 'object' && tokenObj !== null ? (tokenObj as { token?: string }).token : String(tokenObj);
        const inviteLink = token ? `${BRAND_CONFIG.url}/i/${token}` : `${BRAND_CONFIG.url}/i/${inviteData.id}`;

        const { error: smsError } = await supabase.functions.invoke('send-sms-invite', {
          body: {
            phone: phoneOrEmail,
            groupName: groupName || "المجموعة",
            inviteLink,
            senderName: user.user_metadata?.name || "صديقك"
          }
        });

        if (smsError) {
          console.error("SMS error:", smsError);
        }
      } else if (method === "email" && isEmail) {
        // إنشاء group_join_token للرابط الصحيح
        const { data: tokenData } = await supabase.rpc('create_group_join_token', {
          p_group_id: groupId,
          p_role: role,
          p_link_type: 'email_invite'
        });
        const tokenObj2 = Array.isArray(tokenData) ? tokenData[0] : tokenData;
        const token = typeof tokenObj2 === 'object' && tokenObj2 !== null ? (tokenObj2 as { token?: string }).token : String(tokenObj2);
        const inviteLink = token ? `${BRAND_CONFIG.url}/i/${token}` : `${BRAND_CONFIG.url}/i/${inviteData.id}`;

        const { error: emailError } = await supabase.functions.invoke('send-email-invite', {
          body: {
            email: phoneOrEmail,
            groupName: groupName || "المجموعة",
            inviteLink,
            groupId
          }
        });

        if (emailError) {
          console.error("Email error:", emailError);
        }
      }

      // Update status to sent
      await supabase
        .from("invites")
        .update({ status: "sent" })
        .eq("id", inviteData.id);

      const rewardMessage = referralId 
        ? ` (ستحصل على ${rewardDays} أيام مجانية + 30 نقطة عند استخدامه!)`
        : "";
      
      toast.success(`تم إرسال الدعوة بنجاح!${rewardMessage}`);
      await fetchInvites();
      
      return { success: true, data: inviteData, referralId };
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("خطأ في إرسال الدعوة");
      return { error: (error as Error).message };
    }
  }, [groupId, fetchInvites]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("تم إلغاء الدعوة");
      await fetchInvites();
      
      return { success: true };
    } catch (error) {
      console.error("Error cancelling invite:", error);
      toast.error("خطأ في إلغاء الدعوة");
      return { error: (error as Error).message };
    }
  }, [fetchInvites]);

  return {
    invites,
    loading,
    sendInvite,
    cancelInvite,
    fetchInvites
  };
}

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GroupInvite {
  id: string;
  group_id: string;
  phone_or_email: string;
  invited_role: "owner" | "admin" | "member";
  status: "pending" | "sent" | "accepted" | "revoked" | "expired";
  created_at: string;
  created_by: string;
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

      // Create invite
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .insert({
          group_id: groupId,
          phone_or_email: phoneOrEmail,
          invited_role: role,
          created_by: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Determine if it's phone or email
      const isPhone = /^[\+]?[\d\s\-\(\)]+$/.test(phoneOrEmail);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(phoneOrEmail);
      
      // Send based on method and type
      if (method === "smart" && isPhone) {
        // Use smart invite for phones
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
        // Send SMS invite
        const { error: smsError } = await supabase.functions.invoke('send-sms-invite', {
          body: {
            phone: phoneOrEmail,
            groupName: groupName || "المجموعة",
            inviteLink: `${window.location.origin}/invite/${inviteData.id}`,
            senderName: user.user_metadata?.name || "صديقك"
          }
        });

        if (smsError) {
          console.error("SMS error:", smsError);
        }
      } else if (method === "email" && isEmail) {
        // Send email invite
        const { error: emailError } = await supabase.functions.invoke('send-email-invite', {
          body: {
            email: phoneOrEmail,
            groupName: groupName || "المجموعة",
            inviteLink: `${window.location.origin}/invite/${inviteData.id}`,
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

      toast.success("تم إرسال الدعوة بنجاح!");
      await fetchInvites(); // Refresh invites
      
      return { success: true, data: inviteData };
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
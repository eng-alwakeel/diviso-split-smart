import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FamilyMember {
  id: string;
  family_owner_id: string;
  member_user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile?: {
    id: string;
    display_name?: string;
    name?: string;
    phone?: string;
    avatar_url?: string;
  };
}

export interface FamilyInvitation {
  id: string;
  family_owner_id: string;
  invited_email?: string;
  invited_phone?: string;
  invitation_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  role: 'admin' | 'member';
  expires_at: string;
  created_at: string;
}

export function useFamilyPlan() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasFamilyPlan, setHasFamilyPlan] = useState(false);

  const fetchFamilyMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check user's subscription to determine if they can have a family plan
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .single();

      const hasActiveFamilyPlan = subscription && 
        subscription.plan === 'family' && 
        (subscription.status === 'active' || 
         (subscription.status === 'trialing' && new Date(subscription.expires_at) > new Date()));

      setHasFamilyPlan(!!hasActiveFamilyPlan);

      // Check if user is family owner
      const { data: ownedMembers } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_owner_id", user.id);

      // Set owner status based on family plan subscription OR existing owned members
      const isOwnerBySubscription = hasActiveFamilyPlan;
      const isOwnerByMembers = ownedMembers && ownedMembers.length > 0;
      setIsOwner(isOwnerBySubscription || isOwnerByMembers);

      if (ownedMembers && ownedMembers.length > 0) {
        // Fetch profiles for all members
        const membersWithProfiles: FamilyMember[] = [];
        for (const member of ownedMembers) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, name, phone, avatar_url")
            .eq("id", member.member_user_id)
            .single();
          
          membersWithProfiles.push({
            ...member,
            profile: profile || undefined
          } as FamilyMember);
        }
        setMembers(membersWithProfiles);
      } else {
        // Check if user is a family member
        const { data: memberData } = await supabase
          .from("family_members")
          .select("family_owner_id")
          .eq("member_user_id", user.id)
          .single();

        if (memberData) {
          // Fetch all family members for this family
          const { data: allMembers } = await supabase
            .from("family_members")
            .select("*")
            .eq("family_owner_id", memberData.family_owner_id);

          // Fetch profiles for all members
          const membersWithProfiles: FamilyMember[] = [];
          for (const member of allMembers || []) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, name, phone, avatar_url")
              .eq("id", member.member_user_id)
              .single();
            
            membersWithProfiles.push({
              ...member,
              profile: profile || undefined
            } as FamilyMember);
          }
          setMembers(membersWithProfiles);
        }
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
      toast.error("خطأ في جلب بيانات أعضاء العائلة");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("family_invitations")
        .select("*")
        .eq("family_owner_id", user.id)
        .eq("status", "pending");

      setInvitations((data || []) as FamilyInvitation[]);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, []);

  const inviteMember = useCallback(async (emailOrPhone: string, role: 'admin' | 'member' = 'member') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return false;
      }

      const isEmail = emailOrPhone.includes('@');
      const inviteData = {
        family_owner_id: user.id,
        role,
        ...(isEmail ? { invited_email: emailOrPhone } : { invited_phone: emailOrPhone })
      };

      const { data, error } = await supabase
        .from("family_invitations")
        .insert(inviteData)
        .select()
        .single();

      if (error) throw error;

      toast.success("تم إرسال الدعوة بنجاح");
      fetchInvitations();
      return true;
    } catch (error: any) {
      console.error("Error inviting member:", error);
      toast.error(error.message || "خطأ في إرسال الدعوة");
      return false;
    }
  }, [fetchInvitations]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("تم إزالة العضو بنجاح");
      fetchFamilyMembers();
      return true;
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error("خطأ في إزالة العضو");
      return false;
    }
  }, [fetchFamilyMembers]);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("family_invitations")
        .update({ status: 'rejected' })
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("تم إلغاء الدعوة");
      fetchInvitations();
      return true;
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
      toast.error("خطأ في إلغاء الدعوة");
      return false;
    }
  }, [fetchInvitations]);

  const acceptInvitation = useCallback(async (invitationCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return false;
      }

      // Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("family_invitations")
        .select("*")
        .eq("invitation_code", invitationCode)
        .eq("status", "pending")
        .single();

      if (inviteError || !invitation) {
        toast.error("دعوة غير صالحة أو منتهية الصلاحية");
        return false;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        toast.error("الدعوة منتهية الصلاحية");
        return false;
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_owner_id: invitation.family_owner_id,
          member_user_id: user.id,
          role: invitation.role
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from("family_invitations")
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      toast.success("تم قبول الدعوة وانضمامك للخطة العائلية");
      fetchFamilyMembers();
      return true;
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error("خطأ في قبول الدعوة");
      return false;
    }
  }, [fetchFamilyMembers]);

  const leaveFamily = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("member_user_id", user.id);

      if (error) throw error;

      toast.success("تم مغادرة الخطة العائلية");
      fetchFamilyMembers();
      return true;
    } catch (error: any) {
      console.error("Error leaving family:", error);
      toast.error("خطأ في مغادرة الخطة العائلية");
      return false;
    }
  }, [fetchFamilyMembers]);

  useEffect(() => {
    fetchFamilyMembers();
    fetchInvitations();
  }, [fetchFamilyMembers, fetchInvitations]);

  return {
    members,
    invitations,
    loading,
    isOwner,
    hasFamilyPlan,
    inviteMember,
    removeMember,
    cancelInvitation,
    acceptInvitation,
    leaveFamily,
    refreshData: () => {
      fetchFamilyMembers();
      fetchInvitations();
    }
  };
}
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type MemberRole = "admin" | "member";

export const useMemberRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const updateMemberRole = async (
    groupId: string,
    userId: string,
    newRole: MemberRole,
    canApproveExpenses: boolean
  ): Promise<boolean> => {
    setUpdating(true);
    
    try {
      const { error } = await supabase
        .from("group_members")
        .update({
          role: newRole,
          can_approve_expenses: canApproveExpenses
        })
        .eq("group_id", groupId)
        .eq("user_id", userId);

      if (error) {
        console.error("[useMemberRoles] update error:", error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث صلاحيات العضو",
          variant: "destructive"
        });
        return false;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحيات العضو بنجاح"
      });
      
      return true;
    } catch (error) {
      console.error("[useMemberRoles] unexpected error:", error);
      toast({
        title: "خطأ غير متوقع",
        description: "حاول مرة أخرى",
        variant: "destructive"
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateMemberRole,
    updating
  };
};

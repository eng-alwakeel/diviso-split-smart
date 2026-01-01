import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAdminUserActions() {
  const queryClient = useQueryClient();

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, displayName, phone }: { userId: string; displayName?: string; phone?: string }) => {
      const { data, error } = await supabase.rpc('admin_update_user_profile', {
        p_user_id: userId,
        p_display_name: displayName || null,
        p_phone: phone || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("تم تحديث بيانات المستخدم بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في تحديث البيانات", { description: error.message });
    }
  });

  const banUser = useMutation({
    mutationFn: async ({ userId, isBanned, reason, banUntil }: { userId: string; isBanned: boolean; reason?: string; banUntil?: string }) => {
      const { data, error } = await supabase.rpc('admin_ban_user', {
        p_user_id: userId,
        p_is_banned: isBanned,
        p_reason: reason || null,
        p_ban_until: banUntil || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(variables.isBanned ? "تم حظر المستخدم بنجاح" : "تم إلغاء حظر المستخدم بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في تحديث حالة الحظر", { description: error.message });
    }
  });

  const manageCredits = useMutation({
    mutationFn: async ({ userId, amount, operation, reason }: { userId: string; amount: number; operation: 'grant' | 'deduct'; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_manage_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_operation: operation,
        p_reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(variables.operation === 'grant' ? "تم منح النقاط بنجاح" : "تم سحب النقاط بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في إدارة النقاط", { description: error.message });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('admin_delete_user', {
        p_user_id: userId,
        p_reason: reason || null
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("تم حذف المستخدم بنجاح");
    },
    onError: (error: any) => {
      toast.error("خطأ في حذف المستخدم", { description: error.message });
    }
  });

  return {
    updateUserProfile,
    banUser,
    manageCredits,
    deleteUser
  };
}

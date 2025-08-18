import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GroupJoinToken {
  id: string;
  token: string;
  group_id: string;
  role: string;
  max_uses: number;
  current_uses: number;
  link_type: string;
  expires_at: string;
  created_at: string;
  created_by: string;
  used_at?: string;
  used_by?: string;
}

export function useGroupJoinTokens(groupId?: string) {
  const [tokens, setTokens] = useState<GroupJoinToken[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_join_tokens")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error("Error fetching join tokens:", error);
      toast.error("خطأ في جلب روابط الانضمام");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const createToken = useCallback(async (
    role: "owner" | "admin" | "member" = "member",
    linkType: string = "general"
  ) => {
    if (!groupId) {
      toast.error("معرف المجموعة مطلوب");
      return { error: "no_group_id" };
    }

    try {
      const { data, error } = await supabase.rpc('create_group_join_token', {
        p_group_id: groupId,
        p_role: role,
        p_link_type: linkType
      });

      if (error) throw error;

      const tokenData = data[0];
      const url = `${window.location.origin}/i/${tokenData.token}`;
      
      await fetchTokens(); // Refresh tokens list
      
      return { 
        success: true, 
        data: tokenData,
        url
      };
    } catch (error) {
      console.error("Error creating join token:", error);
      toast.error("خطأ في إنشاء رابط الانضمام");
      return { error: (error as Error).message };
    }
  }, [groupId, fetchTokens]);

  const deleteToken = useCallback(async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from("group_join_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;

      toast.success("تم حذف الرابط");
      await fetchTokens();
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting join token:", error);
      toast.error("خطأ في حذف الرابط");
      return { error: (error as Error).message };
    }
  }, [fetchTokens]);

  const getTokenUsage = useCallback(async (tokenId: string) => {
    try {
      const { data, error } = await supabase
        .from("group_join_tokens")
        .select("current_uses, max_uses")
        .eq("id", tokenId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error getting token usage:", error);
      return null;
    }
  }, []);

  return {
    tokens,
    loading,
    createToken,
    deleteToken,
    fetchTokens,
    getTokenUsage
  };
}
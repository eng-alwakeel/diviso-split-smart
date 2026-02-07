import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PendingGroupInvite {
  id: string;
  invited_user_id: string;
  invited_by_user_id: string;
  status: string;
  created_at: string;
  invited_user_name: string;
  invited_user_avatar: string | null;
  invited_by_name: string;
}

export const usePendingGroupInvites = (groupId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: pendingInvites = [], isLoading, refetch } = useQuery({
    queryKey: ["pending-group-invites", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase.rpc("get_pending_group_invites", {
        p_group_id: groupId,
      });

      if (error) {
        console.error("Error fetching pending invites:", error);
        return [];
      }

      return (data as PendingGroupInvite[]) || [];
    },
    enabled: !!groupId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-group-invites", groupId] });
    queryClient.invalidateQueries({ queryKey: ["pending-group-invites-ids", groupId] });
  };

  return {
    pendingInvites,
    isLoading,
    refetch,
    invalidate,
  };
};

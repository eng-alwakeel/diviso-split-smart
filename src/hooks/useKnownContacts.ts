import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface KnownContact {
  id: string;
  contact_user_id: string;
  shared_groups_count: number;
  last_interaction_at: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
}

export const useKnownContacts = (groupId: string | undefined, existingMemberIds: string[] = []) => {
  const { toast } = useToast();
  const { t } = useTranslation("groups");
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ["known-contacts", groupId, existingMemberIds],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const excludeIds = [user.id, ...existingMemberIds];

      const { data, error } = await supabase.rpc("get_known_contacts", {
        p_exclude_user_ids: excludeIds,
      });

      if (error) {
        console.error("Error fetching known contacts:", error);
        return [];
      }

      return (data as KnownContact[]) || [];
    },
    enabled: !!groupId,
  });

  // Fetch pending invites for this group to show "invite sent" state
  const { data: pendingInviteUserIds = [] } = useQuery({
    queryKey: ["pending-group-invites-ids", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase.rpc("get_pending_group_invites", {
        p_group_id: groupId,
      });
      if (error) {
        console.error("Error fetching pending invites:", error);
        return [];
      }
      return (data || []).map((inv: any) => inv.invited_user_id as string);
    },
    enabled: !!groupId,
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!groupId) throw new Error("No group ID");

      const { data, error } = await supabase.rpc("send_group_invite", {
        p_group_id: groupId,
        p_invited_user_id: userId,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        throw new Error(result.error);
      }

      return { userId, result };
    },
    onSuccess: (result) => {
      const contact = contacts.find((c) => c.contact_user_id === result.userId);
      const contactName = contact?.display_name || contact?.name || "";

      toast({
        title: t("known_people.invite_sent"),
        description: t("known_people.invite_sent_desc", { name: contactName }),
      });

      queryClient.invalidateQueries({ queryKey: ["pending-group-invites-ids"] });
      queryClient.invalidateQueries({ queryKey: ["pending-group-invites"] });
    },
    onError: (error: Error) => {
      const message = error.message;
      let description = message;

      if (message.includes("already_member")) {
        description = t("known_people.already_member");
      } else if (message.includes("already_invited")) {
        description = t("known_people.already_invited");
      } else if (message.includes("rate_limited")) {
        description = t("known_people.rate_limited");
      } else if (message.includes("not_authorized")) {
        description = t("known_people.not_authorized");
      }

      toast({
        title: t("known_people.invite_failed"),
        description,
        variant: "destructive",
      });
    },
  });

  return {
    contacts,
    isLoading,
    refetch,
    pendingInviteUserIds,
    sendInvite: sendInviteMutation.mutate,
    sendingUserId: sendInviteMutation.variables as string | undefined,
    isSending: sendInviteMutation.isPending,
  };
};

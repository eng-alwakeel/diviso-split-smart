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

      // Exclude current user + existing members
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

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!groupId) throw new Error("No group ID");

      const { data, error } = await supabase.rpc("add_member_to_group", {
        p_group_id: groupId,
        p_user_id: userId,
      });

      if (error) throw error;
      if (typeof data === "string" && data.startsWith("error:")) {
        throw new Error(data);
      }

      return { userId, result: data };
    },
    onSuccess: (result) => {
      const contact = contacts.find((c) => c.contact_user_id === result.userId);
      const contactName = contact?.display_name || contact?.name || "";

      toast({
        title: t("known_people.added"),
        description: t("known_people.added_desc", { name: contactName }),
      });

      // Invalidate queries to refresh member lists
      queryClient.invalidateQueries({ queryKey: ["known-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["group-members"] });
    },
    onError: (error: Error) => {
      const message = error.message;
      let description = message;

      if (message.includes("already_member")) {
        description = t("known_people.already_member");
      }

      toast({
        title: t("known_people.add_failed"),
        description,
        variant: "destructive",
      });
    },
  });

  return {
    contacts,
    isLoading,
    refetch,
    addMember: addMemberMutation.mutate,
    addingUserId: addMemberMutation.variables as string | undefined,
    isAdding: addMemberMutation.isPending,
  };
};

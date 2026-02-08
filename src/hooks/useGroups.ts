import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type Group = {
  id: string;
  name: string;
  currency: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  status?: string | null;
  group_type?: string | null;
  member_role?: string;
  member_count?: number;
};

async function fetchUserGroups(showArchived = false): Promise<Group[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  // Get all groups where user is a member with proper join
  let query = supabase
    .from("group_members")
    .select(`
      role,
      groups!inner (
        id,
        name,
        currency,
        owner_id,
        created_at,
        updated_at,
        archived_at,
        status,
        group_type
      )
    `)
    .eq("user_id", userData.user.id);

  // Filter groups based on archived status
  if (showArchived) {
    // Show only archived groups (archived_at is not null)
    query = query.not("groups.archived_at", "is", null);
  } else {
    // Show only active groups (archived_at is null)
    query = query.is("groups.archived_at", null);
  }

  const { data: groupMembers, error: membersError } = await query;

  if (membersError) throw membersError;

  // Transform the data and add member count
  const groupsWithDetails = await Promise.all(
    (groupMembers || []).map(async (member: any) => {
      const group = member.groups;
      
      // Get member count for each group
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      return {
        id: group.id,
        name: group.name,
        currency: group.currency,
        owner_id: group.owner_id,
        created_at: group.created_at,
        updated_at: group.updated_at,
        archived_at: group.archived_at,
        status: group.status,
        group_type: group.group_type,
        member_role: member.role,
        member_count: count || 0
      };
    })
  );

  return groupsWithDetails;
}

export function useGroups(showArchived = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-groups", showArchived],
    queryFn: () => fetchUserGroups(showArchived),
    staleTime: 30 * 1000, // 30 seconds - تقليل الوقت للتحديث الأسرع
  });

  // دالة لإعادة تحميل القروبات يدوياً
  const invalidateGroups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["user-groups"] });
  }, [queryClient]);

  return {
    ...query,
    invalidateGroups
  };
}
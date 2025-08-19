import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GroupsStatistics = {
  activeGroups: {
    total: number;
    adminCount: number;
    totalMembers: number;
  };
  archivedGroups: {
    total: number;
    adminCount: number;
    totalMembers: number;
  };
  overall: {
    totalGroups: number;
    totalAdminGroups: number;
    totalMembers: number;
  };
};

async function fetchGroupsStatistics(): Promise<GroupsStatistics> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  // Get all groups where user is a member
  const { data: groupMembers, error: membersError } = await supabase
    .from("group_members")
    .select(`
      role,
      groups!inner (
        id,
        name,
        owner_id,
        archived_at
      )
    `)
    .eq("user_id", userData.user.id);

  if (membersError) throw membersError;

  // Get member counts for all groups
  const groupIds = (groupMembers || []).map((member: any) => member.groups.id);
  
  const { data: memberCounts, error: countsError } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (countsError) throw countsError;

  // Count members per group
  const memberCountMap = (memberCounts || []).reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.group_id] = (acc[curr.group_id] || 0) + 1;
    return acc;
  }, {});

  // Process statistics
  const activeGroups = (groupMembers || []).filter((member: any) => !member.groups.archived_at);
  const archivedGroups = (groupMembers || []).filter((member: any) => member.groups.archived_at);

  const activeAdminCount = activeGroups.filter((member: any) => 
    member.role === 'admin' || member.role === 'owner'
  ).length;

  const archivedAdminCount = archivedGroups.filter((member: any) => 
    member.role === 'admin' || member.role === 'owner'
  ).length;

  const activeTotalMembers = activeGroups.reduce((sum: number, member: any) => 
    sum + (memberCountMap[member.groups.id] || 0), 0
  );

  const archivedTotalMembers = archivedGroups.reduce((sum: number, member: any) => 
    sum + (memberCountMap[member.groups.id] || 0), 0
  );

  return {
    activeGroups: {
      total: activeGroups.length,
      adminCount: activeAdminCount,
      totalMembers: activeTotalMembers,
    },
    archivedGroups: {
      total: archivedGroups.length,
      adminCount: archivedAdminCount,
      totalMembers: archivedTotalMembers,
    },
    overall: {
      totalGroups: (groupMembers || []).length,
      totalAdminGroups: activeAdminCount + archivedAdminCount,
      totalMembers: activeTotalMembers + archivedTotalMembers,
    }
  };
}

export function useGroupsStatistics() {
  return useQuery({
    queryKey: ["groups-statistics"],
    queryFn: fetchGroupsStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
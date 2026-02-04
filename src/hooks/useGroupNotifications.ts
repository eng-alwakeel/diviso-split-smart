import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type GroupNotificationType = 
  | "member_joined" 
  | "member_left" 
  | "group_deleted"
  | "dice_posted"
  | "dice_accepted"
  | "dice_rerolled";

interface NotificationPayload {
  group_name: string;
  group_id?: string;
  member_name?: string;
  deleted_by_name?: string;
  [key: string]: Json | undefined;
}

/**
 * Hook for sending notifications to group members
 * Used when members join, leave, or group is deleted
 */
export function useGroupNotifications() {
  
  /**
   * Get all member IDs in a group except the current user
   */
  const getOtherMembers = async (groupId: string, excludeUserId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .neq("user_id", excludeUserId);
    
    if (error) {
      console.error("[useGroupNotifications] Error fetching members:", error);
      return [];
    }
    
    return data?.map(m => m.user_id) || [];
  };

  /**
   * Get current user's display name
   */
  const getCurrentUserName = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "مستخدم";
    
    const { data } = await supabase
      .from("profiles")
      .select("display_name, name")
      .eq("id", user.id)
      .single();
    
    return data?.display_name || data?.name || "مستخدم";
  };

  /**
   * Send notifications to multiple users
   */
  const sendNotifications = async (
    userIds: string[],
    type: GroupNotificationType,
    payload: NotificationPayload
  ) => {
    if (userIds.length === 0) return;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      payload,
    }));

    const { error } = await supabase
      .from("notifications")
      .insert(notifications);

    if (error) {
      console.error("[useGroupNotifications] Error sending notifications:", error);
    }
  };

  /**
   * Notify group members when a new member joins
   */
  const notifyMemberJoined = async (
    groupId: string,
    groupName: string,
    newMemberUserId: string,
    newMemberName: string
  ) => {
    const memberIds = await getOtherMembers(groupId, newMemberUserId);
    
    await sendNotifications(memberIds, "member_joined", {
      group_name: groupName,
      group_id: groupId,
      member_name: newMemberName,
    });
  };

  /**
   * Notify group members when someone leaves
   */
  const notifyMemberLeft = async (
    groupId: string,
    groupName: string,
    leavingUserId: string
  ) => {
    const leavingUserName = await getCurrentUserName();
    const memberIds = await getOtherMembers(groupId, leavingUserId);
    
    await sendNotifications(memberIds, "member_left", {
      group_name: groupName,
      group_id: groupId,
      member_name: leavingUserName,
    });
  };

  /**
   * Notify all group members before deletion (called before the delete happens)
   */
  const notifyGroupDeleted = async (
    groupId: string,
    groupName: string,
    ownerUserId: string
  ) => {
    const ownerName = await getCurrentUserName();
    const memberIds = await getOtherMembers(groupId, ownerUserId);
    
    await sendNotifications(memberIds, "group_deleted", {
      group_name: groupName,
      deleted_by_name: ownerName,
    });
  };

  /**
   * Notify group members when dice decision is posted
   */
  const notifyDicePosted = async (
    groupId: string,
    groupName: string,
    postedByUserId: string
  ) => {
    const memberIds = await getOtherMembers(groupId, postedByUserId);
    
    await sendNotifications(memberIds, "dice_posted", {
      group_name: groupName,
      group_id: groupId,
    });
  };

  /**
   * Notify group members when dice decision is accepted
   */
  const notifyDiceAccepted = async (
    groupId: string,
    groupName: string,
    currentUserId: string
  ) => {
    const memberIds = await getOtherMembers(groupId, currentUserId);
    
    await sendNotifications(memberIds, "dice_accepted", {
      group_name: groupName,
      group_id: groupId,
    });
  };

  /**
   * Notify group members when dice is rerolled
   */
  const notifyDiceRerolled = async (
    groupId: string,
    groupName: string,
    rerolledByUserId: string
  ) => {
    const memberIds = await getOtherMembers(groupId, rerolledByUserId);
    
    await sendNotifications(memberIds, "dice_rerolled", {
      group_name: groupName,
      group_id: groupId,
    });
  };

  return {
    notifyMemberJoined,
    notifyMemberLeft,
    notifyGroupDeleted,
    notifyDicePosted,
    notifyDiceAccepted,
    notifyDiceRerolled,
  };
}

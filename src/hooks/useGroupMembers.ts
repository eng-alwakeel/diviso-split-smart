import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MemberStatus = 'active' | 'invited' | 'pending' | 'rejected';

interface GroupMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  can_approve_expenses: boolean;
  joined_at: string;
  status: MemberStatus;
  phone_e164: string | null;
  archived_at: string | null;
  profile: {
    id: string;
    display_name: string | null;
    name: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export const useGroupMembers = (groupId: string | null) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMembers = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          can_approve_expenses,
          joined_at,
          profiles!user_id (
            id,
            display_name,
            name,
            avatar_url,
            phone
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching group members:', error);
        toast({
          title: "خطأ في تحميل الأعضاء",
          description: "حدث خطأ أثناء تحميل قائمة أعضاء المجموعة",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: item.profiles
      }));
      setMembers(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ في تحميل الأعضاء",
        description: "حدث خطأ أثناء تحميل قائمة أعضاء المجموعة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const getMemberDisplayName = (member: GroupMember) => {
    if (!member.profile) return 'مستخدم';
    return member.profile.display_name || member.profile.name || 'مستخدم';
  };

  const getApprovers = () => {
    return members.filter(member => 
      member.role === 'admin' || 
      member.role === 'owner' || 
      member.can_approve_expenses
    );
  };

  return {
    members,
    loading,
    refetch: fetchMembers,
    getMemberDisplayName,
    getApprovers,
  };
};
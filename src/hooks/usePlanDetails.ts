import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export interface PlanMember {
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PlanDetails {
  id: string;
  owner_user_id: string;
  group_id: string | null;
  title: string;
  plan_type: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_value: number | null;
  budget_currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  members: PlanMember[];
  group_name?: string | null;
}

export function usePlanDetails(planId: string | undefined) {
  const { toast } = useToast();
  const { t } = useTranslation('plans');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const planQuery = useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (!planId) throw new Error('No plan ID');

      const { data: plan, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;

      // Fetch members with profile data
      const { data: members, error: membersError } = await supabase
        .from('plan_members')
        .select('user_id, role, joined_at')
        .eq('plan_id', planId);

      if (membersError) throw membersError;

      // Fetch profiles for members
      const memberIds = members?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', memberIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedMembers: PlanMember[] = (members || []).map(m => ({
        ...m,
        display_name: profileMap.get(m.user_id)?.display_name || null,
        avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
      }));

      // Fetch group name if linked
      let groupName: string | null = null;
      if (plan.group_id) {
        const { data: group } = await supabase
          .from('groups')
          .select('name')
          .eq('id', plan.group_id)
          .single();
        groupName = group?.name || null;
      }

      return {
        ...plan,
        members: enrichedMembers,
        group_name: groupName,
      } as PlanDetails;
    },
    enabled: !!planId,
  });

  const convertToGroupMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error('No plan ID');
      const { data, error } = await supabase.rpc('convert_plan_to_group', {
        p_plan_id: planId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (groupId) => {
      toast({ title: t('convert_dialog.success') });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigate(`/group/${groupId}`);
    },
    onError: () => {
      toast({ title: t('convert_dialog.error'), variant: 'destructive' });
    },
  });

  const linkToGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!planId) throw new Error('No plan ID');
      const { data, error } = await supabase.rpc('link_plan_to_group', {
        p_plan_id: planId,
        p_group_id: groupId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: t('link_dialog.success') });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: () => {
      toast({ title: t('link_dialog.error'), variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!planId) throw new Error('No plan ID');
      const { data, error } = await supabase.rpc('update_plan_status', {
        p_plan_id: planId,
        p_status: newStatus,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: t('status_change.success') });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: () => {
      toast({ title: t('status_change.error'), variant: 'destructive' });
    },
  });

  const isOwner = planQuery.data?.owner_user_id !== undefined;

  return {
    plan: planQuery.data,
    isLoading: planQuery.isLoading,
    error: planQuery.error,
    convertToGroup: convertToGroupMutation.mutateAsync,
    isConverting: convertToGroupMutation.isPending,
    linkToGroup: linkToGroupMutation.mutateAsync,
    isLinking: linkToGroupMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    refetch: planQuery.refetch,
  };
}

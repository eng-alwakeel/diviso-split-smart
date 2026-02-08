import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export interface Plan {
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
  member_count?: number;
}

interface CreatePlanParams {
  title: string;
  plan_type: string;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_value?: number | null;
  budget_currency?: string;
}

export function usePlans() {
  const { toast } = useToast();
  const { t } = useTranslation('plans');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch plans where user is a member
      const { data: memberPlans, error: memberError } = await supabase
        .from('plan_members')
        .select('plan_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const planIds = memberPlans?.map(m => m.plan_id) || [];

      if (planIds.length === 0) {
        return { myPlans: [] as Plan[], groupPlans: [] as Plan[] };
      }

      const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .in('id', planIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch member counts
      const { data: memberCounts } = await supabase
        .from('plan_members')
        .select('plan_id')
        .in('plan_id', planIds);

      const countMap = new Map<string, number>();
      memberCounts?.forEach(m => {
        countMap.set(m.plan_id, (countMap.get(m.plan_id) || 0) + 1);
      });

      const enrichedPlans = (plans || []).map(p => ({
        ...p,
        member_count: countMap.get(p.id) || 1,
      }));

      const myPlans = enrichedPlans.filter(p => !p.group_id);
      const groupPlans = enrichedPlans.filter(p => p.group_id);

      return { myPlans, groupPlans };
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (params: CreatePlanParams) => {
      const { data, error } = await supabase.rpc('create_plan', {
        p_title: params.title,
        p_plan_type: params.plan_type,
        p_destination: params.destination || null,
        p_start_date: params.start_date || null,
        p_end_date: params.end_date || null,
        p_budget_value: params.budget_value || null,
        p_budget_currency: params.budget_currency || 'SAR',
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: (planId) => {
      toast({ title: t('create.success') });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigate(`/plan/${planId}`);
    },
    onError: () => {
      toast({ title: t('create.error'), variant: 'destructive' });
    },
  });

  return {
    plans: plansQuery.data,
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan: createPlanMutation.mutateAsync,
    isCreating: createPlanMutation.isPending,
    refetch: plansQuery.refetch,
  };
}

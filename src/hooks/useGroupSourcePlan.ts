import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanScheduleDay {
  id: string;
  day_index: number;
  day_date: string | null;
  activities: {
    id: string;
    title: string;
    description: string | null;
    time_slot: string;
    estimated_cost: number | null;
    currency: string | null;
    status: string;
  }[];
}

interface SourcePlanData {
  planId: string;
  planName: string;
  budgetValue: number | null;
  budgetCurrency: string;
  destination: string | null;
  days: PlanScheduleDay[];
}

export function useGroupSourcePlan(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-source-plan', groupId],
    queryFn: async (): Promise<SourcePlanData | null> => {
      if (!groupId) return null;

      // Check if group has source_plan_id
      const { data: group } = await supabase
        .from('groups')
        .select('source_plan_id')
        .eq('id', groupId)
        .single();

      const sourcePlanId = (group as any)?.source_plan_id;
      if (!sourcePlanId) return null;

      // Get plan info
      const { data: plan } = await supabase
        .from('plans')
        .select('id, title, budget_value, budget_currency, destination')
        .eq('id', sourcePlanId)
        .single();

      if (!plan) return null;

      // Get plan days
      const { data: days } = await supabase
        .from('plan_days')
        .select('id, day_index, day_date')
        .eq('plan_id', sourcePlanId)
        .order('day_index');

      if (!days || days.length === 0) {
        return {
          planId: plan.id,
          planName: plan.title,
          budgetValue: plan.budget_value,
          budgetCurrency: plan.budget_currency || 'SAR',
          destination: plan.destination,
          days: [],
        };
      }

      // Get activities for all days
      const dayIds = days.map(d => d.id);
      const { data: activities } = await supabase
        .from('plan_day_activities')
        .select('id, title, description, time_slot, estimated_cost, currency, status, plan_day_id')
        .in('plan_day_id', dayIds)
        .order('time_slot');

      const activityMap = new Map<string, typeof activities>();
      (activities || []).forEach(a => {
        const dayId = (a as any).plan_day_id;
        if (!activityMap.has(dayId)) activityMap.set(dayId, []);
        activityMap.get(dayId)!.push(a);
      });

      const enrichedDays: PlanScheduleDay[] = days.map(d => ({
        id: d.id,
        day_index: d.day_index,
        day_date: d.day_date,
        activities: (activityMap.get(d.id) || []).map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          time_slot: a.time_slot,
          estimated_cost: a.estimated_cost,
          currency: a.currency,
          status: a.status,
        })),
      }));

      return {
        planId: plan.id,
        planName: plan.title,
        budgetValue: plan.budget_value,
        budgetCurrency: plan.budget_currency || 'SAR',
        destination: plan.destination,
        days: enrichedDays,
      };
    },
    enabled: !!groupId,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KPITarget {
  id: string;
  kpi_name: string;
  target_value: number;
  target_type: 'minimum' | 'maximum' | 'exact';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  description: string | null;
  description_ar: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useKPITargets = () => {
  return useQuery({
    queryKey: ['admin-kpi-targets'],
    queryFn: async (): Promise<KPITarget[]> => {
      const { data, error } = await supabase
        .from('admin_kpi_targets')
        .select('*')
        .order('kpi_name');

      if (error) throw error;
      return (data || []) as KPITarget[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useKPITarget = (kpiName: string) => {
  const { data: targets } = useKPITargets();
  return targets?.find(t => t.kpi_name === kpiName);
};

export const useUpdateKPITarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, target_value }: { id: string; target_value: number }) => {
      const { data, error } = await supabase
        .from('admin_kpi_targets')
        .update({ target_value, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kpi-targets'] });
    },
  });
};

export const useCreateKPITarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Omit<KPITarget, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('admin_kpi_targets')
        .insert({
          ...target,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kpi-targets'] });
    },
  });
};

export const useDeleteKPITarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_kpi_targets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kpi-targets'] });
    },
  });
};

// Helper to calculate progress towards target
export const calculateKPIProgress = (
  currentValue: number,
  target: KPITarget
): { percentage: number; status: 'success' | 'warning' | 'danger' } => {
  const { target_value, target_type } = target;
  
  let percentage: number;
  let status: 'success' | 'warning' | 'danger';

  if (target_type === 'maximum') {
    // Lower is better
    percentage = target_value > 0 ? ((target_value - currentValue) / target_value) * 100 + 100 : 100;
    percentage = Math.max(0, Math.min(200, percentage));
    
    if (currentValue <= target_value) {
      status = 'success';
    } else if (currentValue <= target_value * 1.5) {
      status = 'warning';
    } else {
      status = 'danger';
    }
  } else {
    // Higher is better (minimum or exact)
    percentage = target_value > 0 ? (currentValue / target_value) * 100 : 0;
    percentage = Math.max(0, Math.min(200, percentage));
    
    if (currentValue >= target_value) {
      status = 'success';
    } else if (currentValue >= target_value * 0.7) {
      status = 'warning';
    } else {
      status = 'danger';
    }
  }

  return { percentage: Math.round(percentage), status };
};

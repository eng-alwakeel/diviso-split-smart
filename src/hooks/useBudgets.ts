import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Budget = {
  id: string;
  name: string;
  total_amount: number;
  amount_limit?: number;
  start_date: string;
  end_date?: string;
  period: 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom';
  budget_type: 'monthly' | 'trip' | 'event' | 'project' | 'emergency' | 'savings';
  group_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  starts_on?: string;
};

export type CreateBudgetData = {
  name: string;
  total_amount: number;
  amount_limit?: number;
  start_date: string;
  end_date?: string;
  period: 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'custom';
  budget_type: 'monthly' | 'trip' | 'event' | 'project' | 'emergency' | 'savings';
  group_id: string;
  category_id?: string;
};

async function fetchBudgets(groupId?: string): Promise<Budget[]> {
  let query = supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (groupId) {
    query = query.eq("group_id", groupId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

async function createBudget(budgetData: CreateBudgetData): Promise<Budget> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("budgets")
    .insert([{
      ...budgetData,
      created_by: userData.user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateBudget(id: string, updates: Partial<CreateBudgetData>): Promise<Budget> {
  const { data, error } = await supabase
    .from("budgets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function useBudgets(groupId?: string) {
  const queryClient = useQueryClient();

  const {
    data: budgets = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["budgets", groupId],
    queryFn: () => fetchBudgets(groupId),
  });

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["group-budget-tracking"] });
      toast.success("تم إنشاء الميزانية بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في إنشاء الميزانية: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<CreateBudgetData>) =>
      updateBudget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["group-budget-tracking"] });
      toast.success("تم تحديث الميزانية بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في تحديث الميزانية: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["group-budget-tracking"] });
      toast.success("تم حذف الميزانية بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في حذف الميزانية: " + error.message);
    },
  });

  return {
    budgets,
    isLoading,
    error,
    refetch,
    createBudget: createMutation.mutateAsync,
    updateBudget: updateMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
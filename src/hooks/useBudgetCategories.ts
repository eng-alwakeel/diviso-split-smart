import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BudgetCategory = {
  id: string;
  name: string;
  allocated_amount: number;
  budget_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateBudgetCategoryData = {
  name: string;
  allocated_amount: number;
  budget_id: string;
  category_id: string;
};

async function fetchBudgetCategories(budgetId?: string): Promise<BudgetCategory[]> {
  let query = supabase
    .from("budget_categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (budgetId) {
    query = query.eq("budget_id", budgetId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

async function createBudgetCategory(categoryData: CreateBudgetCategoryData): Promise<BudgetCategory> {
  const { data, error } = await supabase
    .from("budget_categories")
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateBudgetCategory(id: string, updates: Partial<CreateBudgetCategoryData>): Promise<BudgetCategory> {
  const { data, error } = await supabase
    .from("budget_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteBudgetCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from("budget_categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function useBudgetCategories(budgetId?: string) {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["budget-categories", budgetId],
    queryFn: () => fetchBudgetCategories(budgetId),
  });

  const createMutation = useMutation({
    mutationFn: createBudgetCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      toast.success("تم إضافة الفئة بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في إضافة الفئة: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<CreateBudgetCategoryData>) =>
      updateBudgetCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      toast.success("تم تحديث الفئة بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في تحديث الفئة: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudgetCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
      toast.success("تم حذف الفئة بنجاح");
    },
    onError: (error: any) => {
      toast.error("فشل في حذف الفئة: " + error.message);
    },
  });

  return {
    categories,
    isLoading,
    error,
    refetch,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
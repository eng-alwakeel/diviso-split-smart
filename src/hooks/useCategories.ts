
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name_ar: string;
  created_by: string | null;
};

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name_ar,created_by")
    .order("name_ar", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

async function insertCategory(name_ar: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ name_ar }])
    .select("id,name_ar,created_by")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No category returned after insert");
  return data as Category;
}

async function patchCategory(id: string, name_ar: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({ name_ar })
    .eq("id", id)
    .select("id,name_ar,created_by")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No category returned after update");
  return data as Category;
}

export function useCategories() {
  const queryClient = useQueryClient();

  const {
    data: categories,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => insertCategory(name),
    meta: { onError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      patchCategory(id, name),
    meta: { onError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories: categories ?? [],
    isLoading,
    isError,
    error,
    addCategory: addMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
  };
}

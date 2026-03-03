import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PayoutMethod {
  id: string;
  user_id: string;
  method_type: string;
  label: string;
  account_name: string | null;
  account_value: string;
  note: string | null;
  is_default: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export type PayoutMethodInsert = Omit<PayoutMethod, 'id' | 'created_at' | 'updated_at'>;

export const maskAccountValue = (value: string): string => {
  if (value.length <= 4) return value;
  return '•'.repeat(value.length - 4) + value.slice(-4);
};

export const METHOD_TYPE_OPTIONS = [
  { value: 'iban', label: 'IBAN', icon: '🏦' },
  { value: 'bank_account', label: 'حساب بنكي', icon: '🏛️' },
  { value: 'stc_bank', label: 'STC Bank', icon: '📱' },
  { value: 'stc_pay', label: 'STC Pay', icon: '💳' },
  { value: 'other', label: 'أخرى', icon: '📝' },
] as const;

export const getMethodIcon = (type: string) => {
  return METHOD_TYPE_OPTIONS.find(m => m.value === type)?.icon || '📝';
};

export const getMethodLabel = (type: string) => {
  return METHOD_TYPE_OPTIONS.find(m => m.value === type)?.label || type;
};

/** Fetch current user's own payout methods */
export function useMyPayoutMethods() {
  return useQuery({
    queryKey: ['my-payout-methods'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_payout_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PayoutMethod[];
    },
  });
}

/** Fetch another user's payout methods (only works if shared group) */
export function useUserPayoutMethods(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['user-payout-methods', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_payout_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PayoutMethod[];
    },
    enabled: !!userId,
  });
}

export function usePayoutMethodMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMethod = useMutation({
    mutationFn: async (method: Omit<PayoutMethodInsert, 'user_id' | 'visibility'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_payout_methods')
        .insert({ ...method, user_id: user.id, visibility: 'group_members_only' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payout-methods'] });
      toast({ title: 'تمت الإضافة', description: 'تم إضافة طريقة الاستلام بنجاح.' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const updateMethod = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayoutMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_payout_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payout-methods'] });
      toast({ title: 'تم التحديث', description: 'تم تحديث طريقة الاستلام.' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_payout_methods')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payout-methods'] });
      toast({ title: 'تم الحذف', description: 'تم حذف طريقة الاستلام.' });
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });

  return { addMethod, updateMethod, deleteMethod };
}

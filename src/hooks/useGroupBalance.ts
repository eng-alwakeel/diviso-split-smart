import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useUserSettings } from "@/hooks/useUserSettings";

export interface GroupBalance {
  user_id: string;
  amount_paid: number;
  amount_owed: number;
  settlements_in: number;
  settlements_out: number;
  net_balance: number;
  converted_net_balance?: number;
  original_currency?: string;
}

export function useGroupBalance(groupId: string) {
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const { convertCurrency } = useCurrencies();
  const { settings } = useUserSettings();

  const loadBalances = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_group_balance', {
        p_group_id: groupId
      });

      if (error) throw error;

      // Get group currency
      const { data: groupData } = await supabase
        .from('groups')
        .select('currency')
        .eq('id', groupId)
        .single();

      const groupCurrency = groupData?.currency || 'SAR';

      // Convert balances to user's preferred currency
      const convertedBalances = data.map((balance: any) => ({
        ...balance,
        converted_net_balance: convertCurrency(
          balance.net_balance,
          groupCurrency,
          settings.currency
        ),
        original_currency: groupCurrency
      }));

      setBalances(convertedBalances);
    } catch (error) {
      console.error('Error loading group balances:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, convertCurrency, settings.currency]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const formatBalance = useCallback((balance: GroupBalance): string => {
    const amount = balance.converted_net_balance ?? balance.net_balance;
    const currency = settings.currency;
    
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount)) + ` ${currency}`;
  }, [settings.currency]);

  return {
    balances,
    loading,
    loadBalances,
    formatBalance
  };
}
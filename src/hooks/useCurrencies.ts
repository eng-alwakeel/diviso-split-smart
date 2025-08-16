import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
}

export function useCurrencies() {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCurrencies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error loading currencies:', error);
      toast({
        title: "خطأ في تحميل العملات",
        description: "حدث خطأ أثناء تحميل قائمة العملات",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadExchangeRates = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('date', today);

      if (error) throw error;
      setExchangeRates(data || []);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      // Don't show toast for exchange rates as it's less critical
    }
  }, []);

  const updateExchangeRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-exchange-rates');
      
      if (error) throw error;
      
      await loadExchangeRates();
      
      toast({
        title: "تم تحديث أسعار الصرف",
        description: "تم تحديث أسعار الصرف بنجاح",
      });
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast({
        title: "خطأ في تحديث أسعار الصرف",
        description: "حدث خطأ أثناء تحديث أسعار الصرف",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [loadExchangeRates, toast]);

  const convertCurrency = useCallback((
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = exchangeRates.find(
      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
    );
    
    if (rate) {
      return amount * rate.rate;
    }
    
    // Try reverse conversion
    const reverseRate = exchangeRates.find(
      r => r.from_currency === toCurrency && r.to_currency === fromCurrency
    );
    
    if (reverseRate && reverseRate.rate !== 0) {
      return amount / reverseRate.rate;
    }
    
    return amount; // Return original amount if no rate found
  }, [exchangeRates]);

  const getExchangeRate = useCallback((
    fromCurrency: string,
    toCurrency: string
  ): number | null => {
    if (fromCurrency === toCurrency) return 1;
    
    const rate = exchangeRates.find(
      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
    );
    
    if (rate) return rate.rate;
    
    // Try reverse conversion
    const reverseRate = exchangeRates.find(
      r => r.from_currency === toCurrency && r.to_currency === fromCurrency
    );
    
    if (reverseRate && reverseRate.rate !== 0) {
      return 1 / reverseRate.rate;
    }
    
    return null;
  }, [exchangeRates]);

  const formatCurrency = useCallback((
    amount: number,
    currencyCode: string,
    showOriginal = false,
    originalCurrency?: string
  ): string => {
    const currency = currencies.find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    const formattedAmount = new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    if (showOriginal && originalCurrency && originalCurrency !== currencyCode) {
      return `${formattedAmount} ${symbol} (من ${originalCurrency})`;
    }
    
    return `${formattedAmount} ${symbol}`;
  }, [currencies]);

  useEffect(() => {
    loadCurrencies();
    loadExchangeRates();
  }, [loadCurrencies, loadExchangeRates]);

  return {
    currencies,
    exchangeRates,
    loading,
    loadCurrencies,
    loadExchangeRates,
    updateExchangeRates,
    convertCurrency,
    getExchangeRate,
    formatCurrency
  };
}
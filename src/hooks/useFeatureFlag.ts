import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useFeatureFlag(flagName: string): { enabled: boolean; isLoading: boolean } {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_feature_flags')
          .select('flag_value')
          .eq('flag_name', flagName)
          .maybeSingle();

        if (!error && data?.flag_value) {
          const value = data.flag_value as { enabled?: boolean };
          setEnabled(value.enabled === true);
        }
      } catch {
        // Default to false on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();
  }, [flagName]);

  return { enabled, isLoading };
}

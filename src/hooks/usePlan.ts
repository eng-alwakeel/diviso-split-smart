import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentPlan = () => {
  const [loading, setLoading] = useState(true);
  const [planCode, setPlanCode] = useState<string>("free");
  const [limits, setLimits] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPlanCode("free"); setLimits(null); setLoading(false); return; }
      const { data, error } = await (supabase as any).rpc('get_current_plan');
      const row: any = Array.isArray(data) ? data?.[0] : data;
      if (!error && row) {
        setPlanCode(row.plan_code || 'free');
        setLimits(row.limits || null);
      } else {
        setPlanCode('free');
      }
      setLoading(false);
    };
    load();
  }, []);

  return { loading, planCode, limits };
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserSubscription } from "./useSubscription";

export function useSubscriptionDebug() {
  const [rawSubscription, setRawSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaw = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRawSubscription(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
        setRawSubscription(null);
      } else {
        setRawSubscription(data as UserSubscription | null);
      }
    } catch (err) {
      setError((err as Error).message);
      setRawSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaw();
  }, []);

  const refresh = () => {
    fetchRaw();
  };

  const isExpired = rawSubscription 
    ? new Date(rawSubscription.expires_at).getTime() < Date.now()
    : false;

  const daysUntilExpiry = rawSubscription
    ? Math.ceil((new Date(rawSubscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    rawSubscription,
    loading,
    error,
    refresh,
    isExpired,
    daysUntilExpiry,
  };
}

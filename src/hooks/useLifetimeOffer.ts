import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LifetimeOfferData {
  available: boolean;
  remaining: number;
}

export function useLifetimeOffer() {
  const [offerData, setOfferData] = useState<LifetimeOfferData>({
    available: false,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchOfferData = async () => {
    try {
      const { data, error } = await supabase.rpc('check_lifetime_offer_availability');
      
      if (error) {
        console.error('Error fetching lifetime offer data:', error);
        return;
      }

      if (data && data.length > 0) {
        setOfferData({
          available: data[0].available,
          remaining: data[0].remaining,
        });
      }
    } catch (error) {
      console.error('Error fetching lifetime offer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferData();
  }, []);

  const refreshOfferData = () => {
    setLoading(true);
    fetchOfferData();
  };

  return {
    ...offerData,
    loading,
    refreshOfferData,
  };
}
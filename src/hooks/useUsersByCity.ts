import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityStats {
  city: string;
  user_count: number;
  avg_lat: number | null;
  avg_lng: number | null;
}

export function useUsersByCity() {
  return useQuery({
    queryKey: ['admin-users-by-city'],
    queryFn: async (): Promise<CityStats[]> => {
      const { data, error } = await supabase.rpc('get_users_by_city');
      if (error) {
        console.error('Error fetching users by city:', error);
        throw error;
      }
      return (data || []) as CityStats[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

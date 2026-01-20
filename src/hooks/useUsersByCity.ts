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
      // Convert bigint strings to numbers for proper calculations
      return (data || []).map((item: Record<string, unknown>) => ({
        city: String(item.city || 'غير محدد'),
        user_count: Number(item.user_count) || 0,
        avg_lat: item.avg_lat ? Number(item.avg_lat) : null,
        avg_lng: item.avg_lng ? Number(item.avg_lng) : null,
      })) as CityStats[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

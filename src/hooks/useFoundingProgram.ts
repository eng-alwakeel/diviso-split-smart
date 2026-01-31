import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FoundingProgramStatsData {
  total: number;
  remaining: number;
  limit: number;
  isClosed: boolean;
}

interface FoundingProgramStats extends FoundingProgramStatsData {
  isLoading: boolean;
}

const FOUNDING_USERS_LIMIT = 1000;

export function useFoundingProgram(): FoundingProgramStats {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-program-stats'],
    queryFn: async (): Promise<FoundingProgramStatsData> => {
      // Use RPC function that bypasses RLS
      const { data, error } = await supabase
        .rpc('get_founding_program_stats');
      
      if (error) {
        console.error('Error fetching founding program stats:', error);
        return { 
          total: 0, 
          remaining: FOUNDING_USERS_LIMIT, 
          limit: FOUNDING_USERS_LIMIT, 
          isClosed: false 
        };
      }
      
      // Type assertion for the RPC response
      const stats = data as unknown as FoundingProgramStatsData;
      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  return {
    total: data?.total ?? 0,
    remaining: data?.remaining ?? FOUNDING_USERS_LIMIT,
    limit: data?.limit ?? FOUNDING_USERS_LIMIT,
    isClosed: data?.isClosed ?? false,
    isLoading
  };
}

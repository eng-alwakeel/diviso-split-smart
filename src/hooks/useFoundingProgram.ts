import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FoundingProgramStats {
  total: number;
  remaining: number;
  limit: number;
  isClosed: boolean;
  isLoading: boolean;
}

const FOUNDING_USERS_LIMIT = 1000;

export function useFoundingProgram(): FoundingProgramStats {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-program-stats'],
    queryFn: async () => {
      // Get total count of users
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error fetching founding program stats:', error);
        return { total: 0, remaining: FOUNDING_USERS_LIMIT, limit: FOUNDING_USERS_LIMIT, isClosed: false };
      }
      
      const total = count ?? 0;
      const remaining = Math.max(0, FOUNDING_USERS_LIMIT - total);
      const isClosed = remaining === 0;
      
      return { total, remaining, limit: FOUNDING_USERS_LIMIT, isClosed };
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

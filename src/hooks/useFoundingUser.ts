import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FoundingUserData {
  userNumber: number | null;
  isFoundingUser: boolean;
  isLoading: boolean;
  lastActiveAt: string | null;
}

export function useFoundingUser(userId?: string): FoundingUserData {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_number, is_founding_user, last_active_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching founding user data:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    userNumber: data?.user_number ?? null,
    isFoundingUser: data?.is_founding_user ?? false,
    lastActiveAt: data?.last_active_at ?? null,
    isLoading
  };
}

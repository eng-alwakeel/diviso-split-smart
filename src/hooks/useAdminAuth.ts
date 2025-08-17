import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return { isAdmin: false };

      // Check if user is admin
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.user.id)
        .single();

      if (error) throw error;
      return { isAdmin: data?.is_admin || false };
    },
  });
}
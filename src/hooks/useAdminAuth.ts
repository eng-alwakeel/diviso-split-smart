import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      try {
        const { data: user, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Auth error:', userError);
          return { 
            isAdmin: false, 
            error: 'خطأ في المصادقة: يرجى تسجيل الدخول مرة أخرى',
            user: null 
          };
        }

        if (!user?.user) {
          return { 
            isAdmin: false, 
            error: 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم الإدارية',
            user: null 
          };
        }

        // Check if user is admin
        const { data, error } = await supabase
          .from("profiles")
          .select("is_admin, display_name, name")
          .eq("id", user.user.id)
          .single();

        if (error) {
          console.error('Profile error:', error);
          return { 
            isAdmin: false, 
            error: 'خطأ في تحميل بيانات المستخدم',
            user: user.user 
          };
        }

        if (!data?.is_admin) {
          return { 
            isAdmin: false, 
            error: 'ليس لديك صلاحيات للوصول إلى لوحة التحكم الإدارية',
            user: user.user,
            profile: data
          };
        }

        return { 
          isAdmin: true, 
          user: user.user,
          profile: data,
          error: null
        };
      } catch (error) {
        console.error('Unexpected admin auth error:', error);
        return { 
          isAdmin: false, 
          error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
          user: null 
        };
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
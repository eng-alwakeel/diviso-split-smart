import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  return useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Auth error:', userError);
          return { 
            isAdmin: false, 
            error: 'خطأ في المصادقة: يرجى تسجيل الدخول مرة أخرى',
            user: null 
          };
        }

        if (!userData?.user) {
          return { 
            isAdmin: false, 
            error: 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم الإدارية',
            user: null 
          };
        }

        // استخدام دالة is_admin_user() التي تتحقق من الأدوار في جدول user_roles
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user');

        if (adminError) {
          console.error('Admin check error:', adminError);
          return { 
            isAdmin: false, 
            error: 'خطأ في التحقق من الصلاحيات',
            user: userData.user 
          };
        }

        // جلب بيانات الملف الشخصي
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, name, is_admin")
          .eq("id", userData.user.id)
          .single();

        if (!isAdmin) {
          return { 
            isAdmin: false, 
            error: 'ليس لديك صلاحيات للوصول إلى لوحة التحكم الإدارية',
            user: userData.user,
            profile
          };
        }

        return { 
          isAdmin: true, 
          user: userData.user,
          profile,
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
    staleTime: 1000 * 60 * 5,
  });
}
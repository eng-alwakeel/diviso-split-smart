import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Settings, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

interface AppHeaderProps {
  showNavigation?: boolean;
}

export const AppHeader = ({ showNavigation = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { isAdmin, badgeConfig } = useAdminBadge();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<{ name?: string; avatar_url?: string; email?: string } | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, display_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        setUserProfile({
          name: profileData?.name || profileData?.display_name || user.email?.split('@')[0],
          avatar_url: profileData?.avatar_url,
          email: user.email
        });
      }
    };
    
    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      // تنظيف شامل للـ session
      await supabase.auth.signOut();
      
      // مسح localStorage بشكل صريح
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "سيتم تحويلك للصفحة الرئيسية",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-[hsl(var(--header-background))] border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Notifications */}
          <div className="justify-self-start">
            <NotificationBell />
          </div>

          {/* Center: Logo */}
          <div
            className="justify-self-center flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={appLogo} alt="شعار Diviso" className="h-8 w-auto" width={128} height={32} />
          </div>

          {/* Right: User Menu */}
          <div className="justify-self-end flex items-center gap-2">
            {isAdmin && (
              <AdminBadge 
                config={badgeConfig} 
                size="sm"
              />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    {userProfile?.avatar_url ? (
                      <AvatarImage src={userProfile.avatar_url} alt="صورة الملف الشخصي" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0) || 'م'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-border/50">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.name || 'مستخدم'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin-dashboard')}
                    className="cursor-pointer text-primary"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>لوحة التحكم الإدارية</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background/95 backdrop-blur-sm border-border/50">
                    <AlertDialogHeader>
                      <AlertDialogTitle>تسجيل الخروج</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLogout}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        تسجيل الخروج
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
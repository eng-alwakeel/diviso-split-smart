import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { AdminBadge } from "@/components/ui/admin-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Settings, LogOut, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

interface AppHeaderProps {
  showNavigation?: boolean;
}

export const AppHeader = ({ showNavigation = true }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { isAdmin, badgeConfig } = useAdminBadge();
  const { toast } = useToast();
  const { t } = useTranslation('common');
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
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      
      toast({
        title: t('header.logout_success'),
        description: t('header.logout_redirect'),
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: t('header.logout_error'),
        description: t('header.logout_error_description'),
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-[hsl(var(--header-background))] border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: User Menu */}
          <div className="justify-self-start flex items-center gap-2">
            {isAdmin && (
              <AdminBadge 
                config={badgeConfig} 
                size="sm"
              />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full h-9 w-9 p-0">
                  <Avatar className="h-9 w-9">
                    {userProfile?.avatar_url ? (
                      <AvatarImage src={userProfile.avatar_url} alt={t('profile')} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0) || t('user.default_initial')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-background border-border">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.name || t('user.default_name')}
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
                  <Settings className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                  <span>{t('settings')}</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin-dashboard')}
                    className="cursor-pointer text-primary"
                  >
                    <Shield className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    <span>{t('header.admin_dashboard')}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Language Switcher inside dropdown */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Globe className="h-4 w-4" />
                    <span>{t('language')}</span>
                  </div>
                  <LanguageSwitcher />
                </div>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <LogOut className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('header.logout_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('header.logout_confirm_description')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleLogout}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t('logout')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Logo */}
          <div
            className="justify-self-center flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={appLogo} alt={t('header.logo_alt')} className="h-8 w-auto" width={128} height={32} />
          </div>

          {/* Right: Credits & Notifications */}
          <div className="justify-self-end flex items-center gap-3">
            <CreditBalance compact />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

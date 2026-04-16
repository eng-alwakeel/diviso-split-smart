import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUserRoles } from "@/hooks/useCurrentUserRoles";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Settings, LogOut, Globe, HeadphonesIcon, ChartBar, TrendingUp, Megaphone, Code, Crown, DollarSign, Receipt, Gift, Map, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { useFoundingUser } from "@/hooks/useFoundingUser";
import { useUsageCredits } from "@/hooks/useUsageCredits";
// FoundingBadge integrated inline

type AppRole = Database["public"]["Enums"]["app_role"];

const appLogo = "/lovable-uploads/e7669fe3-f50f-4cdc-95ba-1e72e597c9c2.png";

interface AppHeaderProps {
  showNavigation?: boolean;
  minimal?: boolean; // Hide user menu, notifications, credits for auth pages
}

// Role menu items configuration
const ROLE_MENU_CONFIG: Partial<Record<AppRole, { icon: React.ReactNode; label: string; path: string; color: string }>> = {
  owner: { icon: <Crown className="h-4 w-4" />, label: "لوحة المالك", path: "/admin-dashboard", color: "text-yellow-600" },
  admin: { icon: <Shield className="h-4 w-4" />, label: "لوحة الإدارة", path: "/admin-dashboard", color: "text-primary" },
  finance_admin: { icon: <DollarSign className="h-4 w-4" />, label: "الإدارة المالية", path: "/admin-dashboard?tab=monetization", color: "text-emerald-600" },
  growth_admin: { icon: <TrendingUp className="h-4 w-4" />, label: "إدارة النمو", path: "/admin-dashboard?tab=stats", color: "text-orange-600" },
  ads_admin: { icon: <Megaphone className="h-4 w-4" />, label: "إدارة الإعلانات", path: "/admin-dashboard?tab=stats", color: "text-pink-600" },
  support_agent: { icon: <HeadphonesIcon className="h-4 w-4" />, label: "لوحة الدعم", path: "/support-dashboard", color: "text-cyan-600" },
  analyst: { icon: <ChartBar className="h-4 w-4" />, label: "التحليلات", path: "/admin-dashboard?tab=stats", color: "text-violet-600" },
  developer: { icon: <Code className="h-4 w-4" />, label: "أدوات المطور", path: "/admin-dashboard?tab=system", color: "text-slate-600" },
};

export const AppHeader = ({ showNavigation = true, minimal = false }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { adminRoles, hasAnyAdminRole, getMainDashboard } = useCurrentUserRoles();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { currentLanguage, changeLanguage } = useLanguage();
  const { balance } = useUsageCredits();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-header'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, display_name, avatar_url, updated_at')
        .eq('id', user.id)
        .single();
      return {
        id: user.id,
        name: profileData?.name || profileData?.display_name || user.email?.split('@')[0],
        avatar_url: profileData?.avatar_url,
        email: user.email,
        updated_at: profileData?.updated_at,
      };
    },
    enabled: !minimal,
    staleTime: 2 * 60 * 1000,
  });

  const { userNumber, isFoundingUser } = useFoundingUser(userProfile?.id);

  const handleLanguageSwitch = () => {
    changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar');
  };

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
          {/* Left: Notification Bell */}
          <div className="justify-self-start flex items-center">
            {!minimal && <NotificationBell />}
          </div>

          {/* Center: Logo */}
          <div
            className="justify-self-center flex items-center gap-3 cursor-pointer h-10"
            onClick={() => navigate(minimal ? '/' : '/dashboard')}
          >
            <img src={appLogo} alt={t('header.logo_alt')} className="h-8 sm:h-10 w-auto" width={128} height={32} style={{ aspectRatio: '128 / 32' }} />
          </div>

          {/* Right: Profile Avatar */}
          <div className="justify-self-end flex items-center">
            {!minimal && (
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
                <DropdownMenuContent align="end" className="w-64 border-border/40" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border) / 0.4)' }}>
                  {/* User Header */}
                  <div className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {userProfile?.avatar_url ? (
                          <AvatarImage src={userProfile.avatar_url} alt={t('profile')} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0) || t('user.default_initial')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-none truncate text-foreground">
                          {userProfile?.name || t('user.default_name')}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground mt-1 truncate">
                          {userProfile?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => navigate('/credit-store')}
                    className="cursor-pointer mx-2 mb-1 rounded-md focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Coins className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-primary" />
                    <span className="text-xs">
                      {t('menu.credits_balance', { count: balance?.totalAvailable || 0 })}
                      {isFoundingUser && userNumber && <> · #{userNumber}</>}
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/30" />

                  {/* Section 1: Primary Tools */}
                  <DropdownMenuItem 
                    onClick={() => navigate('/plans')}
                    className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Map className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-muted-foreground" />
                    <span>{t('menu.my_plans')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/my-expenses')}
                    className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Receipt className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-muted-foreground" />
                    <span>{t('menu.my_expenses')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/referral')}
                    className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Gift className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-muted-foreground" />
                    <span>{t('menu.referral')}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/30" />

                  {/* Section 2: System & Settings */}
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')}
                    className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Settings className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-muted-foreground" />
                    <span>{t('settings')}</span>
                  </DropdownMenuItem>
                  {adminRoles
                    .sort((a, b) => {
                      const order: Record<string, number> = { owner: 0, admin: 1 };
                      return (order[a] ?? 99) - (order[b] ?? 99);
                    })
                    .map((role) => {
                    const config = ROLE_MENU_CONFIG[role];
                    if (!config) return null;
                    return (
                      <DropdownMenuItem 
                        key={role}
                        onClick={() => navigate(config.path)}
                        className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                      >
                        <span className="ltr:mr-2 rtl:ml-2">{config.icon}</span>
                        <span>{config.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem 
                    onClick={handleLanguageSwitch}
                    className="cursor-pointer h-12 focus:bg-[rgba(255,255,255,0.05)]"
                  >
                    <Globe className="ltr:mr-2 rtl:ml-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{t('language')}</span>
                      <span className="text-xs text-muted-foreground">
                        {currentLanguage === 'ar' ? 'العربية → English' : 'English → العربية'}
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/30" />

                  {/* Section 3: Logout */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="cursor-pointer h-12 text-destructive focus:text-destructive focus:bg-destructive/5"
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

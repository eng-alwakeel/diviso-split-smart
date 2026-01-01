import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentUserRoles } from "@/hooks/useCurrentUserRoles";
import { RoleBadge } from "@/components/ui/role-badge";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, PERMISSION_LABELS } from "@/hooks/useRBAC";
import { getRoleBadgeConfig } from "@/hooks/useRoleBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function RolesTab() {
  const navigate = useNavigate();
  const { adminRoles, permissions, isLoading, getDashboardForRole } = useCurrentUserRoles();
  const { isRTL } = useLanguage();
  const { t } = useTranslation('settings');
  
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (adminRoles.length === 0) {
    return (
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('roles.no_roles_title', 'لا توجد أدوار إدارية')}</h3>
          <p className="text-muted-foreground">
            {t('roles.no_roles_description', 'ليس لديك أي صلاحيات إدارية حالياً')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roles Overview Card */}
      <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 text-accent" />
            {t('roles.title', 'أدوارك الإدارية')}
          </CardTitle>
          <CardDescription>
            {t('roles.description', 'الأدوار والصلاحيات المُعينة لحسابك')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminRoles.map((role) => {
            const config = getRoleBadgeConfig(role);
            const dashboard = getDashboardForRole(role);
            
            return (
              <div
                key={role}
                className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.emoji}</span>
                    <div>
                      <h4 className="font-medium">{ROLE_LABELS[role]}</h4>
                      <p className="text-sm text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                  </div>
                  <RoleBadge role={role} size="sm" showEmoji={false} />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const url = dashboard.tabId 
                      ? `${dashboard.path}?tab=${dashboard.tabId}`
                      : dashboard.path;
                    navigate(url);
                  }}
                >
                  {t('roles.go_to_dashboard', 'الذهاب للوحة التحكم')}
                  <Arrow className="w-4 h-4 ms-2" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Permissions Card */}
      {permissions.length > 0 && (
        <Card className="bg-card/90 border border-border/50 shadow-card rounded-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('roles.permissions_title', 'صلاحياتك')}
            </CardTitle>
            <CardDescription>
              {t('roles.permissions_count', 'لديك {{count}} صلاحية', { count: permissions.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {PERMISSION_LABELS[permission] || permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

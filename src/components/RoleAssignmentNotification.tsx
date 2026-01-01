import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCurrentUserRoles } from "@/hooks/useCurrentUserRoles";
import { getRoleBadgeConfig } from "@/hooks/useRoleBadge";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/hooks/useRBAC";
import { useTranslation } from "react-i18next";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const STORAGE_KEY = "acknowledged_roles";

export function RoleAssignmentNotification() {
  const navigate = useNavigate();
  const { adminRoles, getDashboardForRole, isLoading } = useCurrentUserRoles();
  const { t } = useTranslation('common');
  const [newRole, setNewRole] = useState<AppRole | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || adminRoles.length === 0) return;

    // Get previously acknowledged roles
    const storedRoles = localStorage.getItem(STORAGE_KEY);
    const acknowledgedRoles: AppRole[] = storedRoles ? JSON.parse(storedRoles) : [];

    // Find new roles
    const newRoles = adminRoles.filter(
      (role) => !acknowledgedRoles.includes(role)
    );

    if (newRoles.length > 0) {
      // Show notification for the first new role
      setNewRole(newRoles[0]);
      setOpen(true);
    }
  }, [adminRoles, isLoading]);

  const handleAcknowledge = () => {
    if (!newRole) return;

    // Save acknowledged role
    const storedRoles = localStorage.getItem(STORAGE_KEY);
    const acknowledgedRoles: AppRole[] = storedRoles ? JSON.parse(storedRoles) : [];
    acknowledgedRoles.push(newRole);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(acknowledgedRoles));

    setOpen(false);
    setNewRole(null);
  };

  const handleGoToDashboard = () => {
    if (!newRole) return;
    
    handleAcknowledge();
    
    const dashboard = getDashboardForRole(newRole);
    const url = dashboard.tabId
      ? `${dashboard.path}?tab=${dashboard.tabId}`
      : dashboard.path;
    navigate(url);
  };

  if (!newRole) return null;

  const config = getRoleBadgeConfig(newRole);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 text-5xl">{config.emoji}</div>
          <DialogTitle className="text-xl">
            {t('role_notification.title', '🎉 تم منحك صلاحيات جديدة!')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t('role_notification.assigned_as', 'تم تعيينك كـ')}{" "}
            <span className={`font-semibold ${config.textColor}`}>
              "{ROLE_LABELS[newRole]}"
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-3">
            {t('role_notification.you_can_now', 'يمكنك الآن:')}
          </p>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm">{ROLE_DESCRIPTIONS[newRole]}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleAcknowledge} className="w-full sm:w-auto">
            {t('role_notification.later', 'لاحقاً')}
          </Button>
          <Button onClick={handleGoToDashboard} className="w-full sm:w-auto">
            {t('role_notification.go_to_dashboard', 'الذهاب للوحة التحكم')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

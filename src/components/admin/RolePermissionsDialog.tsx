import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";
import { ROLE_LABELS, PERMISSION_LABELS } from "@/hooks/useRBAC";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type PermissionScope = Database["public"]["Enums"]["permission_scope"];

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: AppRole;
  permissions: PermissionScope[];
}

export function RolePermissionsDialog({
  open,
  onOpenChange,
  role,
  permissions,
}: RolePermissionsDialogProps) {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.split(".")[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, PermissionScope[]>);

  const categoryLabels: Record<string, string> = {
    users: "👥 المستخدمين",
    billing: "💳 الفواتير",
    analytics: "📊 التحليلات",
    ads: "📢 الإعلانات",
    support: "🎧 الدعم",
    referrals: "🔗 الإحالات",
    pricing: "💰 التسعير",
    system: "⚙️ النظام",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            صلاحيات دور: {ROLE_LABELS[role]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-semibold text-sm">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-1">
                {perms.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 p-2 rounded bg-muted/50"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {permissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد صلاحيات محددة لهذا الدور
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            إجمالي الصلاحيات:
          </span>
          <Badge>{permissions.length}</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

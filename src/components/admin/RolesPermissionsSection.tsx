import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Eye, Users, Shield, Crown, ChartBar, Megaphone, HeadphonesIcon, TrendingUp, Code, UserCheck, User as UserIcon } from "lucide-react";
import { 
  useAllRolesWithPermissions, 
  useRolesStats,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
} from "@/hooks/useRBAC";
import { RolePermissionsDialog } from "./RolePermissionsDialog";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type PermissionScope = Database["public"]["Enums"]["permission_scope"];

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  owner: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  moderator: <UserCheck className="h-4 w-4" />,
  user: <UserIcon className="h-4 w-4" />,
  finance_admin: <ChartBar className="h-4 w-4" />,
  growth_admin: <TrendingUp className="h-4 w-4" />,
  ads_admin: <Megaphone className="h-4 w-4" />,
  support_agent: <HeadphonesIcon className="h-4 w-4" />,
  analyst: <ChartBar className="h-4 w-4" />,
  developer: <Code className="h-4 w-4" />,
};

// Only show admin-relevant roles (exclude user/moderator from main display)
const ADMIN_ROLES: AppRole[] = [
  "owner",
  "admin",
  "finance_admin",
  "growth_admin",
  "ads_admin",
  "support_agent",
  "analyst",
  "developer",
];

export function RolesPermissionsSection() {
  const { data: rolesPermissions, isLoading: permissionsLoading } = useAllRolesWithPermissions();
  const { data: rolesStats, isLoading: statsLoading } = useRolesStats();
  
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewPermissions = (role: AppRole) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const isLoading = permissionsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ADMIN_ROLES.slice(0, 4).map((role) => (
          <Card key={role}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {ROLE_ICONS[role]}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {rolesStats?.get(role) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            الأدوار والصلاحيات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الدور</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المستخدمين</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ADMIN_ROLES.map((role) => {
                  const permissions = rolesPermissions?.get(role) || [];
                  const userCount = rolesStats?.get(role) || 0;

                  return (
                    <TableRow key={role}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted">
                            {ROLE_ICONS[role]}
                          </div>
                          <span className="font-medium">{ROLE_LABELS[role]}</span>
                          {role === "owner" && (
                            <Badge variant="destructive" className="text-xs">
                              أعلى صلاحية
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs">
                        {ROLE_DESCRIPTIONS[role]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {permissions.length} صلاحية
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPermissions(role)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          عرض التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permission Dialog */}
      {selectedRole && (
        <RolePermissionsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          role={selectedRole}
          permissions={rolesPermissions?.get(selectedRole) || []}
        />
      )}
    </div>
  );
}

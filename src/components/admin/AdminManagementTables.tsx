import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminUserActions } from "@/hooks/useEnhancedAdminStats";
import { AdminBadge } from "@/components/ui/admin-badge";
import { useAdminBadge } from "@/hooks/useAdminBadge";
import { toast } from "sonner";
import { useState } from "react";

interface User {
  id: string;
  display_name?: string;
  name?: string;
  phone?: string;
  created_at: string;
  is_admin: boolean;
  current_plan: string;
  groups_count: number;
  expenses_count: number;
}

interface Group {
  id: string;
  name: string;
  currency: string;
  owner_name: string;
  created_at: string;
  members_count: number;
  expenses_count: number;
  total_amount: number;
}

interface AdminManagementTablesProps {
  users: User[];
  groups: Group[];
}

export const AdminManagementTables = ({ users, groups }: AdminManagementTablesProps) => {
  const queryClient = useQueryClient();
  const { toggleUserAdmin, deleteGroup } = useAdminUserActions();
  const { badgeConfig: adminBadgeConfig } = useAdminBadge();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      setIsLoading(userId);
      await toggleUserAdmin(userId, !currentAdmin);
      toast.success(!currentAdmin ? "تم منح صلاحيات المدير" : "تم إلغاء صلاحيات المدير");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error("حدث خطأ في تحديث الصلاحيات");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${groupName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      setIsLoading(groupId);
      await deleteGroup(groupId);
      toast.success("تم حذف المجموعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
    } catch (error) {
      toast.error("حدث خطأ في حذف المجموعة");
    } finally {
      setIsLoading(null);
    }
  };

  const getPlanBadge = (plan: string) => {
    const config = {
      'free': { label: 'مجاني', className: 'bg-muted/20 text-muted-foreground' },
      'personal': { label: 'شخصي', className: 'bg-info/20 text-info-foreground' },
      'family': { label: 'عائلي', className: 'bg-primary/20 text-primary-foreground' },
      'lifetime': { label: 'مدى الحياة', className: 'bg-warning/20 text-warning-foreground' }
    };
    const planConfig = config[plan as keyof typeof config] || { label: plan, className: 'bg-muted/20 text-muted-foreground' };
    return <Badge className={planConfig.className}>{planConfig.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 إدارة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>المجموعات</TableHead>
                  <TableHead>المصروفات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الصلاحيات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.slice(0, 10).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.display_name || user.name || 'مستخدم مجهول'}
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getPlanBadge(user.current_plan)}</TableCell>
                    <TableCell>{user.groups_count}</TableCell>
                    <TableCell>{user.expenses_count}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <AdminBadge 
                          config={adminBadgeConfig} 
                          size="sm"
                          showLabel={true}
                        />
                      ) : (
                        <Badge variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          مستخدم
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        disabled={isLoading === user.id}
                        variant={user.is_admin ? "destructive" : "default"}
                        size="sm"
                        className="text-xs"
                      >
                        {user.is_admin ? "إلغاء المدير" : "جعل مدير"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Group Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏢 إدارة المجموعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المجموعة</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الأعضاء</TableHead>
                  <TableHead>المصروفات</TableHead>
                  <TableHead>إجمالي المبلغ</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.slice(0, 10).map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.owner_name}</TableCell>
                    <TableCell>{group.currency}</TableCell>
                    <TableCell>{group.members_count}</TableCell>
                    <TableCell>{group.expenses_count}</TableCell>
                    <TableCell className="text-success font-medium">
                      {group.total_amount.toFixed(2)} {group.currency}
                    </TableCell>
                    <TableCell>
                      {new Date(group.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        disabled={isLoading === group.id}
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
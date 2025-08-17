import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminStats, useAdminUsers, useAdminGroups } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Users, 
  Building2, 
  Receipt, 
  DollarSign, 
  Crown, 
  TrendingUp,
  Calendar,
  Activity 
} from "lucide-react";

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: groups, isLoading: groupsLoading } = useAdminGroups();

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">لوحة الإدارة</h1>
            <Badge variant="secondary" className="mr-2">
              Admin Only
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.new_users_this_month || 0} هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المجموعات</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_groups || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.active_users_today || 0} نشط اليوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_expenses || 0}</div>
              <p className="text-xs text-muted-foreground">
                {Number(stats?.total_amount || 0).toLocaleString()} ر.س
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_subscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {Number(stats?.monthly_revenue || 0).toLocaleString()} ر.س شهرياً
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إدارة المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الباقة</TableHead>
                    <TableHead>المجموعات</TableHead>
                    <TableHead>المصروفات</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.slice(0, 10).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.display_name || user.name || "مستخدم"}
                          {user.is_admin && (
                            <Badge variant="destructive" className="text-xs">
                              مدير
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.current_plan === 'free' ? 'secondary' : 'default'}>
                          {user.current_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.groups_count}</TableCell>
                      <TableCell>{user.expenses_count}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.created_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">نشط</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Groups Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              إدارة المجموعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups?.slice(0, 10).map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.owner_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{group.currency}</Badge>
                      </TableCell>
                      <TableCell>{group.members_count}</TableCell>
                      <TableCell>{group.expenses_count}</TableCell>
                      <TableCell>
                        {Number(group.total_amount).toLocaleString()} {group.currency}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(group.created_at), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
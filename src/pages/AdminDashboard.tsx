import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminStats, useAdminUsers, useAdminGroups } from "@/hooks/useAdminStats";
import { useEnhancedAdminStats } from "@/hooks/useEnhancedAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SubscriptionStatsCards } from "@/components/admin/SubscriptionStatsCards";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { TopInsightsCards } from "@/components/admin/TopInsightsCards";
import { AdminManagementTables } from "@/components/admin/AdminManagementTables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const AdminDashboard = () => {
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: groups, isLoading: groupsLoading } = useAdminGroups();
  const { data: enhancedStats, isLoading: enhancedLoading } = useEnhancedAdminStats();

  if (adminLoading || statsLoading || enhancedLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
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
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-6">
        <AdminHeader />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
            <TabsTrigger value="management">الإدارة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">إجمالي المستخدمين</CardTitle>
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    👥
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">{stats?.total_users}</div>
                  <p className="text-xs text-blue-600 mt-1">مسجلين في النظام</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">إجمالي المجموعات</CardTitle>
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    🏢
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{stats?.total_groups}</div>
                  <p className="text-xs text-green-600 mt-1">مجموعات نشطة</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">إجمالي المصروفات</CardTitle>
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    💳
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{stats?.total_expenses}</div>
                  <p className="text-xs text-purple-600 mt-1">مصروف معتمد</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700">إجمالي المبلغ</CardTitle>
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-900">{stats?.total_amount?.toFixed(2)} ر.س</div>
                  <p className="text-xs text-yellow-600 mt-1">إجمالي الإنفاق</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 إحصائيات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاشتراكات النشطة</span>
                    <span className="font-medium">{stats?.active_subscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مستخدمين جدد هذا الشهر</span>
                    <span className="font-medium">{stats?.new_users_this_month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المستخدمين النشطين اليوم</span>
                    <span className="font-medium">{stats?.active_users_today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإيرادات الشهرية</span>
                    <span className="font-medium text-green-600">{stats?.monthly_revenue?.toFixed(2)} ر.س</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📈 نمو الاستخدام</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">معدل النمو الشهري</span>
                    <Badge className="bg-green-100 text-green-800">+12%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">معدل الاحتفاظ</span>
                    <Badge className="bg-blue-100 text-blue-800">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">متوسط المصروفات يومياً</span>
                    <span className="font-medium">{Math.round((stats?.total_expenses || 0) / 30)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 أهداف الأداء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">هدف المستخدمين</span>
                    <span className="font-medium">{((stats?.total_users || 0) / 1000 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">هدف الإيرادات</span>
                    <span className="font-medium">{((stats?.monthly_revenue || 0) / 10000 * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">هدف المجموعات</span>
                    <span className="font-medium">{((stats?.total_groups || 0) / 500 * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            {enhancedStats?.subscriptions && (
              <SubscriptionStatsCards data={enhancedStats.subscriptions} />
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {enhancedStats?.activity && (
              <ActivityChart data={enhancedStats.activity} />
            )}
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            {users && groups && (
              <AdminManagementTables users={users} groups={groups} />
            )}
          </TabsContent>
        </Tabs>

        {/* Legacy Tables - Basic User & Group Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users Table - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 المستخدمين الجدد
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
                      <TableHead>الباقة</TableHead>
                      <TableHead>التسجيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.slice(0, 5).map((user) => (
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
                        <TableCell>
                          <Badge variant={user.current_plan === 'free' ? 'secondary' : 'default'}>
                            {user.current_plan === 'free' ? 'مجاني' : 
                             user.current_plan === 'personal' ? 'شخصي' :
                             user.current_plan === 'family' ? 'عائلي' : 
                             user.current_plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(user.created_at), { 
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

          {/* Groups Table - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏢 المجموعات النشطة
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
                      <TableHead>الأعضاء</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups?.slice(0, 5).map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.members_count}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {Number(group.total_amount).toLocaleString()} {group.currency}
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
    </div>
  );
};

export default AdminDashboard;
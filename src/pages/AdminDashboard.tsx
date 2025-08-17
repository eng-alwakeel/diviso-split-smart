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
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminExport, ExportConfig } from "@/components/admin/AdminExport";
import { toast } from "@/hooks/use-toast";

export const AdminDashboard = () => {
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useAdminGroups();
  const { data: enhancedStats, isLoading: enhancedLoading, refetch: refetchEnhanced } = useEnhancedAdminStats();
  
  const handleFilterChange = (filters: any) => {
    // TODO: Implement filtering logic
    console.log('Filters changed:', filters);
  };
  
  const handleExport = (config: ExportConfig) => {
    // TODO: Implement export functionality
    toast({
      title: "بدء التصدير",
      description: `سيتم تصدير البيانات بصيغة ${config.format.toUpperCase()}`,
    });
    console.log('Export config:', config);
  };
  
  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
    refetchGroups();
    refetchEnhanced();
    toast({
      title: "تم التحديث",
      description: "تم تحديث جميع البيانات بنجاح",
    });
  };

  if (adminLoading || statsLoading || enhancedLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="page-container">
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
    <div className="min-h-screen bg-background">
      <div className="page-container">
        <AdminHeader />
        
        <AdminFilters 
          onFilterChange={handleFilterChange}
          onExport={() => {}}
          onRefresh={handleRefresh}
          isLoading={statsLoading || enhancedLoading}
        />
        
        <div className="flex justify-end mb-4">
          <AdminExport onExport={handleExport} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
            <TabsTrigger value="management">الإدارة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">إجمالي المستخدمين</CardTitle>
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    👥
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.total_users?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">مسجلين في النظام</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/20 border-green-500/20 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">إجمالي المجموعات</CardTitle>
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    🏢
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.total_groups?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">مجموعات نشطة</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/20 border-purple-500/20 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">إجمالي المصروفات</CardTitle>
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    💳
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.total_expenses?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">مصروف معتمد</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/20 border-yellow-500/20 hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">إجمالي المبلغ</CardTitle>
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    💰
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats?.total_amount?.toLocaleString()} ر.س</div>
                  <p className="text-xs text-muted-foreground mt-1">إجمالي الإنفاق</p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📊 إحصائيات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الاشتراكات النشطة</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {stats?.active_subscriptions?.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">مستخدمين جدد هذا الشهر</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {stats?.new_users_this_month?.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">المستخدمين النشطين اليوم</span>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {stats?.active_users_today?.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">الإيرادات الشهرية</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {stats?.monthly_revenue?.toLocaleString()} ر.س
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📈 نمو الاستخدام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">معدل النمو الشهري</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">+12%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">معدل الاحتفاظ</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">متوسط المصروفات يومياً</span>
                    <span className="font-medium text-foreground">
                      {Math.round((stats?.total_expenses || 0) / 30).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">متوسط المجموعات الجديدة</span>
                    <span className="font-medium text-foreground">
                      {Math.round((stats?.total_groups || 0) / 30).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🎯 أهداف الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">هدف المستخدمين (1000)</span>
                      <span className="font-medium text-sm">{((stats?.total_users || 0) / 1000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(((stats?.total_users || 0) / 1000 * 100), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">هدف الإيرادات (10,000 ر.س)</span>
                      <span className="font-medium text-sm">{((stats?.monthly_revenue || 0) / 10000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(((stats?.monthly_revenue || 0) / 10000 * 100), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">هدف المجموعات (500)</span>
                      <span className="font-medium text-sm">{((stats?.total_groups || 0) / 500 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(((stats?.total_groups || 0) / 500 * 100), 100)}%` }}
                      ></div>
                    </div>
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
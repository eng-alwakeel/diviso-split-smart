import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminStats, useAdminUsers, useAdminGroups } from "@/hooks/useAdminStats";
import { useEnhancedAdminStats } from "@/hooks/useEnhancedAdminStats";
import { useBusinessMetrics, useRevenueInsights } from "@/hooks/useBusinessMetrics";
import { RevenueMetricsCards } from "@/components/admin/RevenueMetricsCards";
import { PlanPerformanceChart } from "@/components/admin/PlanPerformanceChart";
import { BusinessHealthMetrics } from "@/components/admin/BusinessHealthMetrics";
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
import { Button } from "@/components/ui/button";
import { Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const AdminDashboard = () => {
  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { data: businessMetrics, isLoading: businessLoading, refetch: refetchBusiness } = useBusinessMetrics();
  const { data: revenueInsights, isLoading: insightsLoading, refetch: refetchInsights } = useRevenueInsights();
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
    Promise.all([
      refetchBusiness(),
      refetchInsights(),
      refetchStats(),
      refetchUsers(), 
      refetchGroups(),
      refetchEnhanced()
    ]).then(() => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث جميع البيانات بنجاح",
      });
    }).catch((error) => {
      console.error('Refresh error:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
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
        
        {/* Admin Management Link */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <Link to="/admin-management">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                إدارة المديرين
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                الإعدادات
              </Button>
            </Link>
          </div>
        </div>
        
        <AdminFilters 
          onFilterChange={handleFilterChange}
          onExport={() => handleExport({ format: 'excel', dataType: 'all', includeFields: ['basic_info'], dateRange: '30' })}
          onRefresh={handleRefresh}
          isLoading={statsLoading || enhancedLoading}
        />
        
        <div className="flex justify-end mb-4">
          <AdminExport onExport={handleExport} isLoading={false} />
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">الإيرادات والنمو</TabsTrigger>
            <TabsTrigger value="health">صحة الأعمال</TabsTrigger>
            <TabsTrigger value="plans">تحليل الباقات</TabsTrigger>
            <TabsTrigger value="activity">النشاط</TabsTrigger>
            <TabsTrigger value="management">الإدارة</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueMetricsCards 
              data={businessMetrics || {} as any} 
              isLoading={businessLoading} 
            />
            
            <PlanPerformanceChart 
              data={businessMetrics || {} as any} 
              isLoading={businessLoading} 
            />
            
            {revenueInsights && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>أهم مصادر الإيرادات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {revenueInsights.top_revenue_sources.map((source, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{source.source}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{source.percentage}%</Badge>
                            <span className="text-sm font-medium">
                              {source.revenue.toLocaleString('ar-SA')} ريال
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>فرص النمو</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {revenueInsights.growth_opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{opportunity.opportunity}</span>
                          <Badge className="bg-green-100 text-green-800">
                            {opportunity.potential}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <BusinessHealthMetrics 
              data={businessMetrics || {} as any} 
              isLoading={businessLoading} 
            />
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <PlanPerformanceChart 
              data={businessMetrics || {} as any} 
              isLoading={businessLoading} 
            />
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
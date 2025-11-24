import { useState, useMemo } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats, useAdminUsers, useAdminGroups } from "@/hooks/useAdminStats";
import { useEnhancedAdminStats } from "@/hooks/useEnhancedAdminStats";
import { useBusinessMetrics, useRevenueInsights } from "@/hooks/useBusinessMetrics";
import { RevenueMetricsCards } from "@/components/admin/RevenueMetricsCards";
import { PlanPerformanceChart } from "@/components/admin/PlanPerformanceChart";
import { BusinessHealthMetrics } from "@/components/admin/BusinessHealthMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
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
import { Settings, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const AdminDashboard = () => {
  return (
    <AdminErrorBoundary>
      <AdminDashboardContent />
    </AdminErrorBoundary>
  );
};

const AdminDashboardContent = () => {
  const [filters, setFilters] = useState({
    search: '',
    plan: 'all',
    dateRange: { from: '', to: '' },
    status: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: adminData, isLoading: adminLoading, error: adminError } = useAdminAuth();
  
  const { 
    data: businessMetrics, 
    isLoading: businessLoading, 
    error: businessError,
    refetch: refetchBusiness 
  } = useBusinessMetrics();
  
  const { 
    data: revenueInsights, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights 
  } = useRevenueInsights();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useAdminGroups();
  const { data: enhancedStats, isLoading: enhancedLoading, refetch: refetchEnhanced } = useEnhancedAdminStats();
  
  // Apply filters to data
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = !filters.search || 
        user.display_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.phone?.includes(filters.search);
      const matchesPlan = filters.plan === 'all' || user.current_plan === filters.plan;
      return matchesSearch && matchesPlan;
    });
  }, [users, filters]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => {
      const matchesSearch = !filters.search || 
        group.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        group.owner_name?.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSearch;
    });
  }, [groups, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const handleExport = async (config: ExportConfig) => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-admin-data', {
        body: { 
          config, 
          filters,
          users: filteredUsers,
          groups: filteredGroups,
          stats,
          businessMetrics
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { 
        type: config.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              config.format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${Date.now()}.${config.format === 'excel' ? 'xlsx' : config.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير البيانات بصيغة ${config.format.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: error.message || "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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

  // Handle critical errors
  if (adminError || businessError || insightsError) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">خطأ في تحميل البيانات</h2>
            <p className="text-muted-foreground text-sm">
              {adminError?.message || businessError?.message || insightsError?.message || 
               'حدث خطأ في تحميل بيانات لوحة الإدارة'}
            </p>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <AdminExport onExport={handleExport} isLoading={isExporting} />
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
            {filteredUsers && filteredGroups && (
              <AdminManagementTables users={filteredUsers} groups={filteredGroups} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
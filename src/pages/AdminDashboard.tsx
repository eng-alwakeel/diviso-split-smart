import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStats, useAdminUsers, useAdminGroups } from "@/hooks/useAdminStats";
import { useEnhancedAdminStats } from "@/hooks/useEnhancedAdminStats";
import { useBusinessMetrics, useRevenueInsights } from "@/hooks/useBusinessMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { AdminManagementTables } from "@/components/admin/AdminManagementTables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminExport, ExportConfig } from "@/components/admin/AdminExport";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Settings, Shield, AlertTriangle, RefreshCw, BarChart3, Target, DollarSign, Coins, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ExecutiveSnapshot } from "@/components/admin/ExecutiveSnapshot";
import { FunnelAnalytics } from "@/components/admin/FunnelAnalytics";
import { RetentionCohorts } from "@/components/admin/RetentionCohorts";
import { MonetizationDashboard } from "@/components/admin/MonetizationDashboard";
import { CreditsEconomyHealth } from "@/components/admin/CreditsEconomyHealth";

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
      <SEO title="لوحة تحكم المدير" noIndex={true} />
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

        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="executive" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Executive</span>
            </TabsTrigger>
            <TabsTrigger value="funnel" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden md:inline">Funnel</span>
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Retention</span>
            </TabsTrigger>
            <TabsTrigger value="monetization" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Monetization</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-1">
              <Coins className="h-4 w-4" />
              <span className="hidden md:inline">Credits</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive">
            <ExecutiveSnapshot />
          </TabsContent>

          <TabsContent value="funnel">
            <FunnelAnalytics />
          </TabsContent>

          <TabsContent value="retention">
            <RetentionCohorts />
          </TabsContent>

          <TabsContent value="monetization">
            <MonetizationDashboard />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsEconomyHealth />
          </TabsContent>
        </Tabs>

        {/* Management Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">إدارة المستخدمين والمجموعات</h2>
          {filteredUsers && filteredGroups && (
            <AdminManagementTables users={filteredUsers} groups={filteredGroups} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
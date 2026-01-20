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
import { Settings, Shield, AlertTriangle, RefreshCw, BarChart3, Target, DollarSign, Coins, Users, Lock, Headphones, Tv2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ExecutiveSnapshot } from "@/components/admin/ExecutiveSnapshot";
import { FunnelAnalytics } from "@/components/admin/FunnelAnalytics";
import { RetentionCohorts } from "@/components/admin/RetentionCohorts";
import { MonetizationCenter } from "@/components/admin/MonetizationCenter";
import { CreditsEconomyHealth } from "@/components/admin/CreditsEconomyHealth";
import { RolesPermissionsSection } from "@/components/admin/RolesPermissionsSection";
import { KPITargetsManager } from "@/components/admin/KPITargetsManager";
import { useAdminTabs } from "@/hooks/useAdminTabs";

export const AdminDashboard = () => {
  return (
    <AdminErrorBoundary>
      <AdminDashboardContent />
    </AdminErrorBoundary>
  );
};

const AdminDashboardContent = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    searchType: 'all' as 'all' | 'name' | 'phone' | 'email',
    plan: 'all',
    dateRange: { from: '', to: '' },
    status: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: adminData, isLoading: adminLoading, error: adminError } = useAdminAuth();
  const { allowedTabs, defaultTab, canManageAdmins, canAccessSupport, isLoading: tabsLoading } = useAdminTabs();
  
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
  
  // Apply filters to data with search type support
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      if (!filters.search) {
        const matchesPlan = filters.plan === 'all' || user.current_plan === filters.plan;
        return matchesPlan;
      }
      
      const searchLower = filters.search.toLowerCase();
      let matchesSearch = false;
      
      switch (filters.searchType) {
        case 'name':
          matchesSearch = user.display_name?.toLowerCase().includes(searchLower) ||
                          user.name?.toLowerCase().includes(searchLower) || false;
          break;
        case 'phone':
          matchesSearch = user.phone?.includes(filters.search) || false;
          break;
        case 'email':
          matchesSearch = (user as any).email?.toLowerCase().includes(searchLower) || false;
          break;
        default: // 'all'
          matchesSearch = user.display_name?.toLowerCase().includes(searchLower) ||
                          user.name?.toLowerCase().includes(searchLower) ||
                          user.phone?.includes(filters.search) ||
                          (user as any).email?.toLowerCase().includes(searchLower) || false;
      }
      
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

  if (adminLoading || statsLoading || enhancedLoading || tabsLoading) {
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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminHeader />
        
        {/* Admin Management Links - Responsive */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {canManageAdmins && (
              <Link to="/admin-management">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">إدارة المديرين</span>
                </Button>
              </Link>
            )}
            {canAccessSupport && (
              <Link to="/admin/support">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  <span className="hidden sm:inline">دعم العملاء</span>
                </Button>
              </Link>
            )}
            <Link to="/settings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">الإعدادات</span>
              </Button>
            </Link>
          </div>
          
          {/* TV Mode Button */}
          <Button 
            onClick={() => navigate('/admin-tv')}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <Tv2 className="h-4 w-4" />
            <span className="hidden sm:inline">وضع العرض الكبير</span>
            <span className="sm:hidden">TV</span>
          </Button>
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

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className={`grid w-full h-auto`} style={{ gridTemplateColumns: `repeat(${Math.min(allowedTabs.length, 8)}, minmax(0, 1fr))` }}>
            {allowedTabs.some(t => t.id === "executive") && (
              <TabsTrigger value="executive" className="flex items-center gap-1 py-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">Executive</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "funnel") && (
              <TabsTrigger value="funnel" className="flex items-center gap-1 py-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">Funnel</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "retention") && (
              <TabsTrigger value="retention" className="flex items-center gap-1 py-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">Retention</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "monetization") && (
              <TabsTrigger value="monetization" className="flex items-center gap-1 py-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">Monetization</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "credits") && (
              <TabsTrigger value="credits" className="flex items-center gap-1 py-2">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">Credits</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "targets") && (
              <TabsTrigger value="targets" className="flex items-center gap-1 py-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">الأهداف</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "permissions") && (
              <TabsTrigger value="permissions" className="flex items-center gap-1 py-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">الصلاحيات</span>
              </TabsTrigger>
            )}
            {allowedTabs.some(t => t.id === "management") && (
              <TabsTrigger value="management" className="flex items-center gap-1 py-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline text-xs lg:text-sm">الإدارة</span>
              </TabsTrigger>
            )}
          </TabsList>

          {allowedTabs.some(t => t.id === "executive") && (
            <TabsContent value="executive">
              <ExecutiveSnapshot />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "funnel") && (
            <TabsContent value="funnel">
              <FunnelAnalytics />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "retention") && (
            <TabsContent value="retention">
              <RetentionCohorts />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "monetization") && (
            <TabsContent value="monetization">
              <MonetizationCenter />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "credits") && (
            <TabsContent value="credits">
              <CreditsEconomyHealth />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "targets") && (
            <TabsContent value="targets">
              <KPITargetsManager />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "permissions") && (
            <TabsContent value="permissions">
              <RolesPermissionsSection />
            </TabsContent>
          )}

          {allowedTabs.some(t => t.id === "management") && (
            <TabsContent value="management">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">إدارة المستخدمين والمجموعات</h2>
                {filteredUsers && filteredGroups && (
                  <AdminManagementTables users={filteredUsers} groups={filteredGroups} />
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
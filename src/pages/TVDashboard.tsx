import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminStats } from "@/hooks/useAdminStats";
import { 
  useUserActivityMetrics, 
  useCreditsEconomyHealth, 
  useRevenueMetricsKPI,
  useRetentionCohorts,
  useGrowthLoopMetrics
} from "@/hooks/useAdminKPIs";
import { useUsersByCity } from "@/hooks/useUsersByCity";
import { TVKPICard } from "@/components/admin/TVKPICard";
import { UsersLocationMap } from "@/components/admin/UsersLocationMap";
import { CityStatsPanel } from "@/components/admin/CityStatsPanel";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  UserPlus, 
  Zap,
  X,
  RefreshCw,
  Maximize,
  Minimize,
  Layers,
  CreditCard,
  BarChart3,
  Repeat
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const TVDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const { data: adminData, isLoading: adminLoading } = useAdminAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: activity, isLoading: activityLoading, refetch: refetchActivity } = useUserActivityMetrics();
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = useCreditsEconomyHealth();
  const { data: revenue, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenueMetricsKPI();
  const { data: retention, isLoading: retentionLoading, refetch: refetchRetention } = useRetentionCohorts(2);
  const { data: growth, isLoading: growthLoading, refetch: refetchGrowth } = useGrowthLoopMetrics();
  const { data: cityData, isLoading: cityLoading, refetch: refetchCity } = useUsersByCity();

  const isLoading = adminLoading || activityLoading || creditsLoading || revenueLoading || retentionLoading || statsLoading || growthLoading;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchActivity(),
      refetchCredits(),
      refetchRevenue(),
      refetchRetention(),
      refetchGrowth(),
      refetchCity(),
    ]);
    setLastRefresh(new Date());
  }, [refetchStats, refetchActivity, refetchCredits, refetchRevenue, refetchRetention, refetchGrowth, refetchCity]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = setInterval(handleRefresh, 30000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, handleRefresh]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          navigate('/admin-dashboard');
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'r' || e.key === 'R') {
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, handleRefresh]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check admin access
  if (!adminLoading && !adminData?.isAdmin) {
    navigate('/admin-dashboard');
    return null;
  }

  const latestCohort = retention?.[0];
  const d7Rate = latestCohort?.d7_rate || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8 overflow-auto">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Diviso - لوحة المقاييس الحية</h1>
            <p className="text-white/60 text-sm">
              آخر تحديث: {format(lastRefresh, 'HH:mm:ss', { locale: ar })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Clock */}
          <div className="text-3xl md:text-4xl font-mono tabular-nums text-white/80">
            {format(currentTime, 'HH:mm:ss')}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin-dashboard')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Keyboard hints */}
      <div className="text-xs text-white/40 mb-6 flex gap-4 flex-wrap">
        <span>اضغط <kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd> للشاشة الكاملة</span>
        <span>اضغط <kbd className="px-1.5 py-0.5 bg-white/10 rounded">R</kbd> للتحديث</span>
        <span>اضغط <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> للخروج</span>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-white/10" />
          ))}
        </div>
      ) : (
        <>
          {/* Main KPIs - Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <TVKPICard
              title="إجمالي المستخدمين"
              value={stats?.total_users || 0}
              icon={Users}
              kpiName="total_users"
            />
            <TVKPICard
              title="إجمالي المجموعات"
              value={stats?.total_groups || 0}
              icon={Layers}
              kpiName="total_groups"
            />
            <TVKPICard
              title="إجمالي المصاريف"
              value={stats?.total_expenses || 0}
              icon={CreditCard}
              kpiName="total_expenses"
            />
            <TVKPICard
              title="المشتركين النشطين"
              value={revenue?.subscriber_count || 0}
              icon={DollarSign}
              kpiName="active_subscribers"
            />
          </div>

          {/* Activity KPIs - Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <TVKPICard
              title="المستخدمون النشطون اليوم"
              value={activity?.dau || 0}
              icon={Users}
              kpiName="dau"
            />
            <TVKPICard
              title="المستخدمون النشطون شهرياً"
              value={activity?.mau || 0}
              icon={Users}
              kpiName="mau"
            />
            <TVKPICard
              title="معدل الالتصاق"
              value={activity?.stickiness || 0}
              unit="%"
              icon={TrendingUp}
              kpiName="stickiness"
              threshold={{ green: 30, yellow: 20 }}
            />
            <TVKPICard
              title="مستخدمون جدد اليوم"
              value={activity?.new_users_today || 0}
              icon={UserPlus}
              kpiName="new_users"
            />
          </div>

          {/* Revenue & Growth KPIs - Row 3 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <TVKPICard
              title="D7 Retention"
              value={d7Rate}
              unit="%"
              icon={Target}
              kpiName="d7_retention"
              threshold={{ green: 25, yellow: 15 }}
            />
            <TVKPICard
              title="إيرادات الشهر"
              value={revenue?.total_monthly_revenue || 0}
              unit="ر.س"
              icon={DollarSign}
              kpiName="monthly_revenue"
            />
            <TVKPICard
              title="K-Factor"
              value={growth?.k_factor || 0}
              icon={Repeat}
              kpiName="k_factor"
              threshold={{ green: 1, yellow: 0.5 }}
            />
            <TVKPICard
              title="معدل الإلغاء"
              value={revenue?.churn_rate || 0}
              unit="%"
              icon={Target}
              kpiName="churn_rate"
              threshold={{ green: 5, yellow: 10, invert: true }}
            />
          </div>

          {/* Map Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <UsersLocationMap data={cityData || []} isLoading={cityLoading} />
            </div>
            <div className="lg:col-span-1">
              <CityStatsPanel data={cityData || []} isLoading={cityLoading} maxCities={8} />
            </div>
          </div>
        </>
      )}

      {/* Auto-refresh toggle */}
      <div className="fixed bottom-4 left-4">
        <Button
          variant={autoRefreshEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          className={autoRefreshEnabled 
            ? "bg-emerald-600 hover:bg-emerald-700" 
            : "bg-white/10 border-white/20 text-white"
          }
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
          {autoRefreshEnabled ? 'تحديث تلقائي' : 'تحديث متوقف'}
        </Button>
      </div>
    </div>
  );
};

export default TVDashboard;

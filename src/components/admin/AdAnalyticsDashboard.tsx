import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Eye,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  Download,
  Loader2,
  Gift,
  Percent,
  BarChart3,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";

interface OverviewMetrics {
  total_impressions: number;
  total_clicks: number;
  total_revenue: number;
  total_uc_granted: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
  rewarded_completion_rate: number;
}

interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  revenue: number;
  uc_granted: number;
}

interface TypeMetric {
  ad_type: string;
  impressions: number;
  clicks: number;
  revenue: number;
  uc_granted: number;
}

interface PartnerMetric {
  partner_id: string;
  partner_name: string;
  impressions: number;
  clicks: number;
  revenue: number;
  conversions: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function AdAnalyticsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [platform, setPlatform] = useState('all');
  
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyMetric[]>([]);
  const [byType, setByType] = useState<TypeMetric[]>([]);
  const [byPartner, setByPartner] = useState<PartnerMetric[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, platform]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Fetch ad_events for calculations
      let query = supabase
        .from('ad_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: events, error } = await query;
      if (error) throw error;

      // Calculate overview metrics
      const impressions = events?.filter(e => e.event_type === 'impression') || [];
      const clicks = events?.filter(e => e.event_type === 'click') || [];
      const claims = events?.filter(e => e.event_type === 'claim') || [];
      const completes = events?.filter(e => e.event_type === 'complete') || [];
      const starts = events?.filter(e => e.event_type === 'start') || [];

      const totalImpressions = impressions.length;
      const totalClicks = clicks.length;
      const totalRevenue = events?.reduce((sum, e) => sum + (e.revenue_amount || 0), 0) || 0;
      const totalUC = claims.reduce((sum, e) => sum + (e.uc_granted || 0), 0);

      setOverview({
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_revenue: totalRevenue,
        total_uc_granted: totalUC,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        conversions: 0, // Will be fetched from conversions table
        conversion_rate: 0,
        rewarded_completion_rate: starts.length > 0 ? (completes.length / starts.length) * 100 : 0
      });

      // Group by date for daily chart
      const dailyMap = new Map<string, DailyMetric>();
      events?.forEach(event => {
        const date = format(new Date(event.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { date, impressions: 0, clicks: 0, revenue: 0, uc_granted: 0 };
        
        if (event.event_type === 'impression') existing.impressions++;
        if (event.event_type === 'click') existing.clicks++;
        existing.revenue += event.revenue_amount || 0;
        if (event.event_type === 'claim') existing.uc_granted += event.uc_granted || 0;
        
        dailyMap.set(date, existing);
      });

      setDailyData(Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

      // Group by ad_type
      const typeMap = new Map<string, TypeMetric>();
      events?.forEach(event => {
        const existing = typeMap.get(event.ad_type) || { ad_type: event.ad_type, impressions: 0, clicks: 0, revenue: 0, uc_granted: 0 };
        
        if (event.event_type === 'impression') existing.impressions++;
        if (event.event_type === 'click') existing.clicks++;
        existing.revenue += event.revenue_amount || 0;
        if (event.event_type === 'claim') existing.uc_granted += event.uc_granted || 0;
        
        typeMap.set(event.ad_type, existing);
      });

      setByType(Array.from(typeMap.values()));

      // Fetch partner data with names
      const partnerEvents = events?.filter(e => e.partner_id) || [];
      const partnerIds = [...new Set(partnerEvents.map(e => e.partner_id))];
      
      if (partnerIds.length > 0) {
        const { data: partners } = await supabase
          .from('affiliate_partners')
          .select('id, name')
          .in('id', partnerIds);

        const partnerMap = new Map<string, PartnerMetric>();
        partnerEvents.forEach(event => {
          const partner = partners?.find(p => p.id === event.partner_id);
          const existing = partnerMap.get(event.partner_id!) || {
            partner_id: event.partner_id!,
            partner_name: partner?.name || 'Unknown',
            impressions: 0,
            clicks: 0,
            revenue: 0,
            conversions: 0
          };
          
          if (event.event_type === 'impression') existing.impressions++;
          if (event.event_type === 'click') existing.clicks++;
          existing.revenue += event.revenue_amount || 0;
          
          partnerMap.set(event.partner_id!, existing);
        });

        setByPartner(Array.from(partnerMap.values()));
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'خطأ',
        description: 'تعذر تحميل الإحصاءات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csvData = [
        ['Date', 'Impressions', 'Clicks', 'Revenue', 'UC Granted'].join(','),
        ...dailyData.map(d => [d.date, d.impressions, d.clicks, d.revenue, d.uc_granted].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'تم التصدير', description: 'تم تصدير البيانات بنجاح' });
    } catch (error) {
      toast({ title: 'خطأ', description: 'تعذر تصدير البيانات', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">إحصاءات الإعلانات</h2>
          <p className="text-muted-foreground text-sm">تحليل شامل لأداء الإعلانات والشركاء</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="14">14 يوم</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
              <SelectItem value="90">90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المنصات</SelectItem>
              <SelectItem value="ios">iOS</SelectItem>
              <SelectItem value="android">Android</SelectItem>
              <SelectItem value="web">Web</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="mr-2 hidden sm:inline">تصدير</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المشاهدات</p>
                <p className="text-2xl font-bold">{overview?.total_impressions.toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">النقرات</p>
                <p className="text-2xl font-bold">{overview?.total_clicks.toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CTR</p>
                <p className="text-2xl font-bold">{overview?.ctr.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإيرادات</p>
                <p className="text-2xl font-bold">{overview?.total_revenue.toLocaleString('ar-SA')} ر.س</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UC مُوزّع</p>
                <p className="text-2xl font-bold">{overview?.total_uc_granted.toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">التحويلات</p>
                <p className="text-2xl font-bold">{overview?.conversions.toLocaleString('ar-SA')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{overview?.conversion_rate.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rewarded Completion</p>
                <p className="text-2xl font-bold">{overview?.rewarded_completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">الترند اليومي</TabsTrigger>
          <TabsTrigger value="byType">حسب النوع</TabsTrigger>
          <TabsTrigger value="byPartner">حسب الشريك</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>الترند اليومي</CardTitle>
              <CardDescription>المشاهدات والنقرات على مدار الفترة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={d => format(new Date(d), 'dd/MM')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={d => format(new Date(d), 'dd MMM yyyy', { locale: ar })}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" name="مشاهدات" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" name="نقرات" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byType">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>المشاهدات حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="impressions"
                      nameKey="ad_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ ad_type, percent }) => `${ad_type} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {byType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الأداء حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={byType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ad_type" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" name="مشاهدات" fill="hsl(var(--primary))" />
                    <Bar dataKey="clicks" name="نقرات" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="byPartner">
          <Card>
            <CardHeader>
              <CardTitle>أداء الشركاء</CardTitle>
              <CardDescription>المشاهدات والنقرات لكل شريك</CardDescription>
            </CardHeader>
            <CardContent>
              {byPartner.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات شركاء للفترة المحددة
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byPartner}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="partner_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" name="مشاهدات" fill="hsl(var(--primary))" />
                    <Bar dataKey="clicks" name="نقرات" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="revenue" name="إيرادات" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

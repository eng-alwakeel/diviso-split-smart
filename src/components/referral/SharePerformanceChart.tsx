import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { PLATFORM_CONFIGS, type SocialPlatform } from '@/lib/socialShareConfig';
import { TrendingUp, Share2, Users } from 'lucide-react';

interface SharePerformanceChartProps {
  stats: Record<string, {
    total_shares: number;
    conversions: number;
    conversion_rate: number;
  }>;
}

export const SharePerformanceChart = ({ stats }: SharePerformanceChartProps) => {
  // Transform stats for charts
  const chartData = Object.entries(stats).map(([platform, data]) => {
    const config = PLATFORM_CONFIGS[platform as SocialPlatform];
    return {
      platform: config?.name || platform,
      shares: data.total_shares,
      conversions: data.conversions,
      rate: Math.round(data.conversion_rate),
      color: config?.color || '#888888'
    };
  }).sort((a, b) => b.shares - a.shares);

  const totalShares = chartData.reduce((sum, item) => sum + item.shares, 0);
  const totalConversions = chartData.reduce((sum, item) => sum + item.conversions, 0);
  const avgConversionRate = totalShares > 0 
    ? Math.round((totalConversions / totalShares) * 100) 
    : 0;

  // Prepare pie chart data
  const pieData = chartData.map(item => ({
    name: item.platform,
    value: item.shares,
    color: item.color
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Share2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد بيانات مشاركة حتى الآن</p>
            <p className="text-sm mt-2">ابدأ بمشاركة إحالتك على السوشيال ميديا!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشاركات</p>
                <p className="text-3xl font-bold">{totalShares}</p>
              </div>
              <Share2 className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التحويلات الناجحة</p>
                <p className="text-3xl font-bold text-success">{totalConversions}</p>
              </div>
              <Users className="h-8 w-8 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">معدل التحويل</p>
                <p className="text-3xl font-bold text-primary">{avgConversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Shares vs Conversions */}
      <Card>
        <CardHeader>
          <CardTitle>المشاركات والتحويلات حسب المنصة</CardTitle>
          <CardDescription>مقارنة بين عدد المشاركات والتحويلات الناجحة</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="shares" name="المشاركات" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                ))}
              </Bar>
              <Bar dataKey="conversions" name="التحويلات" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع المشاركات حسب المنصة</CardTitle>
          <CardDescription>النسبة المئوية لكل منصة من إجمالي المشاركات</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الأداء</CardTitle>
          <CardDescription>معدل التحويل لكل منصة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((item) => (
              <div key={item.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.platform}</span>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">مشاركات</div>
                    <div className="font-semibold">{item.shares}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">تحويلات</div>
                    <div className="font-semibold text-success">{item.conversions}</div>
                  </div>
                  
                  <div className="text-center min-w-[60px]">
                    <div className="text-muted-foreground text-xs">معدل النجاح</div>
                    <div className="font-bold text-primary">{item.rate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

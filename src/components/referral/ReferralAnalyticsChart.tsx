import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReferralSummary } from "@/hooks/useReferralAnalytics";

interface ReferralAnalyticsChartProps {
  chartData: any[];
  summary: ReferralSummary | null;
}

export function ReferralAnalyticsChart({ chartData, summary }: ReferralAnalyticsChartProps) {
  const getTrendIcon = () => {
    if (!summary) return <Minus className="h-4 w-4" />;
    
    switch (summary.recent_trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = () => {
    if (!summary) return 'مستقر';
    
    switch (summary.recent_trend) {
      case 'up':
        return 'تحسن';
      case 'down':
        return 'انخفاض';
      default:
        return 'مستقر';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* إحصائيات سريعة */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">إحصائيات سريعة</h3>
        
        {summary && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إجمالي الإحالات</span>
              <span className="font-bold text-lg">{summary.total_sent}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">إحالات ناجحة</span>
              <span className="font-bold text-lg text-green-600">{summary.total_accepted}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">معدل النجاح</span>
              <span className="font-bold text-lg">
                {summary.overall_conversion_rate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">الاتجاه الحالي</span>
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span className="font-medium">{getTrendText()}</span>
              </div>
            </div>

            {summary.best_day && (
              <div className="bg-primary/5 p-3 rounded-lg mt-4">
                <p className="text-sm font-medium mb-1">أفضل يوم</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(summary.best_day.date).toLocaleDateString('ar-SA')}
                </p>
                <p className="text-lg font-bold text-primary">
                  {summary.best_day.conversion_rate.toFixed(1)}% معدل نجاح
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* رسم بياني */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">معدل النجاح خلال الفترة الماضية</h3>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                labelStyle={{ color: '#000' }}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات كافية لعرض الرسم البياني
          </div>
        )}
      </Card>

      {/* رسم بياني للإحالات المرسلة والمقبولة */}
      <Card className="p-6 md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">الإحالات المرسلة مقابل المقبولة</h3>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                labelStyle={{ color: '#000' }}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="sent" fill="hsl(var(--muted))" name="مرسلة" />
              <Bar dataKey="accepted" fill="hsl(var(--primary))" name="مقبولة" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات كافية لعرض الرسم البياني
          </div>
        )}
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BusinessMetrics } from "@/hooks/useBusinessMetrics";

interface PlanPerformanceChartProps {
  data: BusinessMetrics;
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const planNames: Record<string, string> = {
  'free': 'مجاني',
  'personal': 'شخصي',
  'family': 'عائلي',
  'lifetime': 'مدى الحياة'
};

export const PlanPerformanceChart = ({ data, isLoading }: PlanPerformanceChartProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = data.plan_performance.map((plan, index) => ({
    ...plan,
    name: planNames[plan.plan] || plan.plan,
    fill: COLORS[index % COLORS.length]
  }));

  const totalRevenue = data.plan_performance.reduce((sum, plan) => sum + plan.revenue, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>أداء الباقات - الإيرادات</span>
            <Badge variant="secondary">
              {totalRevenue.toLocaleString('ar-SA')} ريال
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{`باقة ${label}`}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">الإيرادات: </span>
                          <span className="font-medium">{payload[0].value} ريال</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">المستخدمين: </span>
                          <span className="font-medium">{payload[0].payload.users}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>توزيع المستخدمين حسب الباقة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="users"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">{data.users} مستخدم</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-2">
              {chartData.map((plan, index) => (
                <div key={plan.plan} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: plan.fill }}
                    ></div>
                    <span>{plan.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{plan.users} مستخدم</span>
                    <Badge variant="outline">
                      {plan.revenue.toLocaleString('ar-SA')} ريال
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
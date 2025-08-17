import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityData {
  date: string;
  new_users: number;
  active_users: number;
  new_groups: number;
  new_expenses: number;
  ocr_usage: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'dd/MM', { locale: ar })
  })).reverse(); // Reverse to show chronological order

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 نشاط المستخدمين (آخر 30 يوم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                labelFormatter={(label) => `التاريخ: ${label}`}
                formatter={(value: number, name: string) => {
                  const nameMap: Record<string, string> = {
                    new_users: 'مستخدمين جدد',
                    active_users: 'مستخدمين نشطين'
                  };
                  return [value, nameMap[name] || name];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="new_users" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="active_users" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 النشاط اليومي (المجموعات والمصروفات)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip 
                labelFormatter={(label) => `التاريخ: ${label}`}
                formatter={(value: number, name: string) => {
                  const nameMap: Record<string, string> = {
                    new_groups: 'مجموعات جديدة',
                    new_expenses: 'مصروفات جديدة',
                    ocr_usage: 'استخدام OCR'
                  };
                  return [value, nameMap[name] || name];
                }}
              />
              <Bar 
                dataKey="new_groups" 
                fill="hsl(var(--chart-1))" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="new_expenses" 
                fill="hsl(var(--chart-2))" 
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="ocr_usage" 
                fill="hsl(var(--chart-3))" 
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
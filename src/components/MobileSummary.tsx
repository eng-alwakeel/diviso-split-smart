import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, Receipt, TrendingUp } from "lucide-react";

interface MobileSummaryProps {
  paid: number;
  owed: number;
  totalExpenses: number;
  groupsCount: number;
  recentCount: number;
}

const MobileSummary: React.FC<MobileSummaryProps> = ({
  paid,
  owed,
  totalExpenses,
  groupsCount,
  recentCount,
}) => {
  const data = [
    { name: "مدفوع", value: Math.max(0, Math.round(paid)), fill: "var(--color-مدفوع)" },
    { name: "مستحق", value: Math.max(0, Math.round(owed)), fill: "var(--color-مستحق)" },
  ];

  const net = Math.round(paid - owed);
  const totalPie = Math.max(1, data.reduce((s, d) => s + d.value, 0));

  const config = {
    "مدفوع": { label: "مدفوع", color: "hsl(var(--primary))" },
    "مستحق": { label: "مستحق", color: "hsl(var(--destructive))" },
  } as const;

  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">الملخص</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <ChartContainer config={config as any} className="aspect-[16/9]">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                strokeWidth={2}
                isAnimationActive
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">الصافي</div>
              <div className="text-lg font-bold text-foreground">
                {net.toLocaleString()} ر.س
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">إجمالي المصاريف</div>
                <div className="text-sm font-bold text-primary">
                  {Math.round(totalExpenses).toLocaleString()} ر.س
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">المجموعات</div>
                <div className="text-sm font-bold text-foreground">{groupsCount}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">المصاريف الأخيرة</div>
                <div className="text-sm font-bold text-foreground">{recentCount}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">نسبة المدفوع</div>
                <div className="text-sm font-bold text-foreground">
                  {Math.round((Math.max(0, paid) / totalPie) * 100)}%
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileSummary;

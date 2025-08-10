import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const paidPct = Math.round((Math.max(0, paid) / totalPie) * 100);
  const owedPct = 100 - paidPct;

  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">الملخص</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <div className="h-6 rounded-2xl bg-muted border border-border overflow-hidden flex">
            <div
              className="h-full bg-accent"
              style={{ width: `${paidPct}%` }}
              aria-label={`مدفوع ${paidPct}%`}
            />
            <div
              className="h-full bg-destructive/80"
              style={{ width: `${owedPct}%` }}
              aria-label={`مستحق ${owedPct}%`}
            />
          </div>
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
                <div className="text-sm font-bold text-foreground">
                  {Math.round(totalExpenses).toLocaleString()} ر.س
                </div>
              </div>
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">المجموعات</div>
                <div className="text-sm font-bold text-foreground">{groupsCount}</div>
              </div>
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent-foreground" />
                </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-3 bg-background/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">المصاريف الأخيرة</div>
                <div className="text-sm font-bold text-foreground">{recentCount}</div>
              </div>
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-accent-foreground" />
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
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-accent-foreground" />
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileSummary;

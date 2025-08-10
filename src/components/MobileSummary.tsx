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
  const net = Math.round(paid - owed);
  const total = Math.max(1, Math.max(0, paid) + Math.max(0, owed));
  const paidPct = Math.round((Math.max(0, paid) / total) * 100);

  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground text-base">الملخص</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-foreground">
          <span className="text-muted-foreground">الصافي:</span>{" "}
          <span className="font-bold">{net.toLocaleString()} ر.س</span>
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
                  {paidPct}%
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

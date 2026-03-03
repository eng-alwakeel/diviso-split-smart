import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Users, DollarSign, Dice1, TrendingUp, Clock } from "lucide-react";

interface TripSummaryData {
  groupName: string;
  totalExpenses: number;
  currency: string;
  memberCount: number;
  expenseCount: number;
  settlementCount: number;
  diceCount: number;
  topPayer?: { name: string; amount: number };
  fastestSettler?: { name: string };
  duration?: string; // e.g. "5 أيام"
}

export const TripSummaryCard = ({ data }: { data: TripSummaryData }) => {
  const stats = [
    { icon: Receipt, label: "إجمالي المصاريف", value: `${data.totalExpenses.toLocaleString()} ${data.currency}`, color: "text-accent" },
    { icon: Users, label: "الأعضاء", value: data.memberCount.toString(), color: "text-primary" },
    { icon: DollarSign, label: "عدد العمليات", value: data.expenseCount.toString(), color: "text-accent" },
    { icon: TrendingUp, label: "التسويات", value: data.settlementCount.toString(), color: "text-green-500" },
    { icon: Dice1, label: "مرات النرد", value: data.diceCount.toString(), color: "text-amber-500" },
  ];

  return (
    <div className="space-y-4" id="trip-summary-card">
      {/* Header */}
      <div className="text-center space-y-1 p-4 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
        <p className="text-2xl">🎉</p>
        <h3 className="text-lg font-black">ملخص الرحلة</h3>
        <p className="text-sm text-muted-foreground">{data.groupName}</p>
        {data.duration && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            {data.duration}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <Card key={i} className={`border-border/30 ${i === 0 ? "col-span-2" : ""}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={`text-base font-black ${i === 0 ? stat.color : ""}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Highlights */}
      {(data.topPayer || data.fastestSettler) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground">🏆 أبرز الأعضاء</h4>
          {data.topPayer && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/5 border border-accent/10">
              <span className="text-base">💰</span>
              <div>
                <p className="text-xs font-medium">أكثر مساهمة</p>
                <p className="text-xs text-muted-foreground">{data.topPayer.name} — {data.topPayer.amount.toLocaleString()} {data.currency}</p>
              </div>
            </div>
          )}
          {data.fastestSettler && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
              <span className="text-base">🟢</span>
              <div>
                <p className="text-xs font-medium">أسرع سداد</p>
                <p className="text-xs text-muted-foreground">{data.fastestSettler.name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Branding */}
      <p className="text-center text-[10px] text-muted-foreground/50 pt-2">
        Diviso — قسّم بذكاء
      </p>
    </div>
  );
};

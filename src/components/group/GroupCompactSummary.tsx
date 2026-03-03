import { cn } from "@/lib/utils";
import { Users, Receipt, Wallet } from "lucide-react";

interface GroupCompactSummaryProps {
  myBalance: number;
  totalExpenses: number;
  memberCount: number;
  currencyLabel: string;
}

export const GroupCompactSummary = ({
  myBalance,
  totalExpenses,
  memberCount,
  currencyLabel,
}: GroupCompactSummaryProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 px-1">
      {/* رصيدك — الأبرز */}
      <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
        <Wallet className="w-4 h-4 text-muted-foreground mb-1" />
        <p className={cn(
          "text-xl font-black leading-none",
          myBalance >= 0 ? "text-green-600" : "text-destructive"
        )}>
          {myBalance >= 0 ? '+' : ''}{myBalance.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">رصيدك ({currencyLabel})</p>
      </div>

      {/* إجمالي المصاريف */}
      <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
        <Receipt className="w-4 h-4 text-muted-foreground mb-1" />
        <p className="text-lg font-bold text-foreground leading-none">
          {totalExpenses.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">المصاريف ({currencyLabel})</p>
      </div>

      {/* عدد الأعضاء */}
      <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-card border border-border/50">
        <Users className="w-4 h-4 text-muted-foreground mb-1" />
        <p className="text-lg font-bold text-foreground leading-none">
          {memberCount}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">أعضاء</p>
      </div>
    </div>
  );
};

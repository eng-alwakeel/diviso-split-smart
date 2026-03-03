import { Progress } from "@/components/ui/progress";

interface SettlementProgressBarProps {
  /** Total absolute debt across all members */
  totalDebt: number;
  /** Total amount already settled */
  totalSettled: number;
  /** Number of members still owing */
  debtorCount: number;
  /** Number of pending confirmations */
  pendingCount: number;
}

export const SettlementProgressBar = ({
  totalDebt,
  totalSettled,
  debtorCount,
  pendingCount,
}: SettlementProgressBarProps) => {
  if (totalDebt <= 0) return null;

  const percentage = Math.min(100, Math.round((totalSettled / totalDebt) * 100));

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          تم تسوية {percentage}% من المبالغ
        </p>
        <p className="text-xs text-muted-foreground">
          {totalSettled.toLocaleString()} / {totalDebt.toLocaleString()}
        </p>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        {debtorCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            {debtorCount} مدين
          </span>
        )}
        {pendingCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {pendingCount} بانتظار تأكيد
          </span>
        )}
      </div>
    </div>
  );
};

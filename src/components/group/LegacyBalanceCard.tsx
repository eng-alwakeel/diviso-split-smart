import { cn } from "@/lib/utils";

interface LegacyBalanceCardProps {
  fromName: string;
  toName: string;
  amount: number;
  currency: string;
  note?: string;
}

export const LegacyBalanceCard = ({
  fromName,
  toName,
  amount,
  currency,
  note,
}: LegacyBalanceCardProps) => {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 my-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <span className="text-lg">💰</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            رصيد سابق
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {fromName} مدين لـ {toName} بـ{" "}
            <span className="font-bold text-amber-600">{amount.toLocaleString()} {currency}</span>
          </p>
          {note && note !== "رصيد سابق" && (
            <p className="text-xs text-muted-foreground mt-1">📝 {note}</p>
          )}
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">قبل استخدام Diviso</p>
        </div>
      </div>
    </div>
  );
};

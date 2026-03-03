import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { BrandedDiviso } from "@/components/ui/branded-diviso";

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettlementShareCardProps {
  groupName: string;
  currency: string;
  settlements: Settlement[];
  formatName: (userId: string) => string;
}

export const SettlementShareCard = forwardRef<HTMLDivElement, SettlementShareCardProps>(
  ({ groupName, currency, settlements, formatName }, ref) => {
    const today = new Date().toLocaleDateString("ar-SA");

    return (
      <div
        ref={ref}
        className="bg-card border border-border rounded-xl p-6 space-y-4 relative overflow-hidden print:shadow-none"
        dir="rtl"
      >
        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04]">
          <span className="text-7xl font-black text-foreground -rotate-12 select-none">
            Diviso
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">التسويات المقترحة</h2>
          <p className="text-sm text-muted-foreground">{groupName}</p>
        </div>

        {/* Settlement list */}
        <div className="space-y-3">
          {settlements.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-destructive">{formatName(s.from)}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-accent">{formatName(s.to)}</span>
              </div>
              <span className="font-bold text-foreground">
                {Math.abs(s.amount).toLocaleString()} {currency}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{today}</span>
          <span className="flex items-center gap-1">
            عبر <BrandedDiviso className="text-xs" />
          </span>
        </div>
      </div>
    );
  }
);

SettlementShareCard.displayName = "SettlementShareCard";

/**
 * Build plain-text version of settlements for sharing via WhatsApp/social
 */
export function buildSettlementShareText(
  groupName: string,
  currency: string,
  settlements: Array<{ from: string; to: string; amount: number }>,
  formatName: (id: string) => string
): string {
  const lines = settlements.map(
    (s, i) =>
      `${i + 1}. ${formatName(s.from)} → ${formatName(s.to)}: ${Math.abs(s.amount).toLocaleString()} ${currency}`
  );

  return [
    `💸 التسويات المقترحة — ${groupName}`,
    "",
    ...lines,
    "",
    `📅 ${new Date().toLocaleDateString("ar-SA")}`,
    `— Diviso`,
  ].join("\n");
}

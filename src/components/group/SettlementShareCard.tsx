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
  exportMode?: boolean;
}

export const SettlementShareCard = forwardRef<HTMLDivElement, SettlementShareCardProps>(
  ({ groupName, currency, settlements, formatName, exportMode = false }, ref) => {
    const today = new Date().toLocaleDateString("ar-SA");

    // When exportMode is true, use fixed colors so html2canvas can capture them
    const styles = exportMode
      ? {
          container: "rounded-xl p-6 space-y-4 relative overflow-hidden",
          containerStyle: { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" },
          watermark: "absolute inset-0 pointer-events-none flex items-center justify-center",
          watermarkStyle: { opacity: 0.04 },
          watermarkText: "text-7xl font-black -rotate-12 select-none",
          watermarkTextStyle: { color: "#111827" },
          title: "text-lg font-bold",
          titleStyle: { color: "#111827" },
          subtitle: "text-sm",
          subtitleStyle: { color: "#6b7280" },
          row: "flex items-center justify-between p-3 rounded-lg",
          rowStyle: { backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" },
          fromName: "font-medium text-sm",
          fromNameStyle: { color: "#ef4444" },
          arrow: "w-4 h-4",
          arrowStyle: { color: "#9ca3af" },
          toName: "font-medium text-sm",
          toNameStyle: { color: "#10b981" },
          amount: "font-bold",
          amountStyle: { color: "#111827" },
          footer: "pt-3 flex items-center justify-between text-xs",
          footerStyle: { borderTop: "1px solid #e5e7eb", color: "#6b7280" },
        }
      : {
          container: "bg-card border border-border rounded-xl p-6 space-y-4 relative overflow-hidden print:shadow-none",
          containerStyle: {},
          watermark: "absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04]",
          watermarkStyle: {},
          watermarkText: "text-7xl font-black text-foreground -rotate-12 select-none",
          watermarkTextStyle: {},
          title: "text-lg font-bold text-foreground",
          titleStyle: {},
          subtitle: "text-sm text-muted-foreground",
          subtitleStyle: {},
          row: "flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30",
          rowStyle: {},
          fromName: "font-medium text-destructive",
          fromNameStyle: {},
          arrow: "w-4 h-4 text-muted-foreground",
          arrowStyle: {},
          toName: "font-medium text-accent",
          toNameStyle: {},
          amount: "font-bold text-foreground",
          amountStyle: {},
          footer: "pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground",
          footerStyle: {},
        };

    return (
      <div
        ref={ref}
        className={styles.container}
        style={styles.containerStyle}
        dir="rtl"
      >
        {/* Watermark */}
        <div className={styles.watermark} style={styles.watermarkStyle}>
          <span className={styles.watermarkText} style={styles.watermarkTextStyle}>
            Diviso
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className={styles.title} style={styles.titleStyle}>التسويات المقترحة</h2>
          <p className={styles.subtitle} style={styles.subtitleStyle}>{groupName}</p>
        </div>

        {/* Settlement list */}
        <div className="space-y-3">
          {settlements.map((s, i) => (
            <div
              key={i}
              className={styles.row}
              style={styles.rowStyle}
            >
              <div className="flex items-center gap-2 text-sm">
                <span className={styles.fromName} style={styles.fromNameStyle}>{formatName(s.from)}</span>
                <ArrowRight className={styles.arrow} style={styles.arrowStyle} />
                <span className={styles.toName} style={styles.toNameStyle}>{formatName(s.to)}</span>
              </div>
              <span className={styles.amount} style={styles.amountStyle}>
                {Math.abs(s.amount).toLocaleString()} {currency}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer} style={styles.footerStyle}>
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
    ``,
    `— Diviso`,
    `https://diviso-split-smart.lovable.app`,
  ].join("\n");
}

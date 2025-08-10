import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ExpenseCardItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  groupName: string;
  myShare?: number;
  isPayer?: boolean;
}

interface RecentExpensesCardsProps {
  items: ExpenseCardItem[];
}

// Stacked, hover-reveal expense cards (up to 10)
// Uses design system semantic tokens and subtle animations
const RecentExpensesCards: React.FC<RecentExpensesCardsProps> = ({ items }) => {
  const palette = [
    "bg-primary/10",
    "bg-accent/10",
    "bg-secondary/20",
    "bg-muted",
  ];

  const visible = items.slice(0, 10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const handleToggle = (id: string) => setSelectedId(prev => (prev === id ? null : id));

  return (
    <div aria-label="آخر 10 مصاريف" className="relative">
      {visible.map((item, i) => {
        const bg = palette[i % palette.length];
        return (
          <div
            key={item.id}
            className={cn(
              "group relative",
              (selectedId === item.id) ? "" : i === 0 ? "" : "-mt-6 md:-mt-8"
            )}
            style={{ zIndex: (selectedId === item.id) ? 1000 : 10 + i }}
          >
            <div className={cn(
              "rounded-2xl p-[2px] transition-colors",
              selectedId === item.id ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60"
            )}>
              <div
                className={cn(
                  "relative rounded-[14px] border border-border shadow-sm p-4 transition-all overflow-hidden",
                  selectedId === item.id ? "h-40 md:h-48 ring-2 ring-primary scale-[1.03] -translate-y-1" : "h-24 md:h-28",
                  "hover:scale-[1.01] hover:shadow-md focus-within:scale-[1.01]",
                  "hover:ring-2 focus:ring-2 ring-primary/40",
                  "will-change-transform",
                  bg
                )}
                role="button"
                tabIndex={0}
                aria-label={`${item.title} - ${item.amount.toLocaleString()} ر.س`}
                aria-pressed={selectedId === item.id}
                aria-expanded={selectedId === item.id}
                onClick={() => handleToggle(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle(item.id);
                  }
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between text-foreground">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.groupName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{item.amount.toLocaleString()} ر.س</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>

                {/* Expanded summary when selected */}
                {selectedId === item.id && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-4 text-foreground">
                      <div>
                        <p className="text-[11px] text-muted-foreground">حالتي</p>
                        {item.isPayer ? (
                          <p className="text-sm font-semibold text-primary">دفعتها</p>
                        ) : (
                          <p className="text-sm font-semibold text-primary">
                            {typeof item.myShare === "number" ? `${item.myShare.toLocaleString()} ر.س` : "—"}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] text-muted-foreground">التفاصيل</p>
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.groupName} • {item.date}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover reveal details inside the card - only when not selected */}
                {selectedId !== item.id && (
                  <div className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl",
                    "bg-background/70 backdrop-blur-sm border-t border-border",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  )}>
                    <div className="p-3 grid grid-cols-2 gap-3 text-foreground">
                      <div>
                        <p className="text-[11px] text-muted-foreground">حالتي</p>
                        {item.isPayer ? (
                          <p className="text-sm font-semibold text-primary">دفعتها</p>
                        ) : (
                          <p className="text-sm font-semibold text-primary">
                            {typeof item.myShare === "number" ? `${item.myShare.toLocaleString()} ر.س` : "—"}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] text-muted-foreground">التفاصيل</p>
                        <p className="text-sm font-medium truncate">{item.title}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentExpensesCards;

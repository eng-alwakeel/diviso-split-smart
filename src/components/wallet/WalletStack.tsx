import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface WalletItem {
  id: string;
  name: string;
}

interface WalletStackProps {
  items: WalletItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// Apple Wallet-style stacked cards with reversed order (last item on top)
export const WalletStack: React.FC<WalletStackProps> = ({ items, selectedId, onSelect, onPrev, onNext }) => {
  const reversed = [...items].reverse(); // show last on top
  const overlap = -24; // px overlap between cards

  const colorClasses = [
    "bg-group-card text-card-foreground",
    "bg-total-card text-card-foreground",
    "bg-referral-card text-card-foreground",
    "bg-secondary text-secondary-foreground",
  ];

  return (
    <div className="relative">
      {/* Nav controls */}
      {items.length > 1 && (
        <div className="absolute right-2 -top-3 z-[100] flex flex-col gap-2">
          <button
            type="button"
            onClick={onPrev}
            aria-label="السابق"
            className="rounded-full bg-primary/10 text-primary p-2 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="التالي"
            className="rounded-full bg-primary/10 text-primary p-2 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <div aria-label="قائمة المجموعات" role="list" className="space-y-0">
        {reversed.map((item, idx) => {
          const z = idx + 1; // higher z-index on top as we already reversed
          const negativeOffset = idx === 0 ? 0 : overlap;
          const color = colorClasses[idx % colorClasses.length];
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              role="listitem"
              className="relative animate-fade-in"
              style={{ zIndex: z, marginTop: negativeOffset }}
            >
              <div className={`rounded-2xl p-[2px] ${isSelected ? "bg-primary" : "bg-primary/40"}`}>
                <button
                  type="button"
                  aria-label={item.name}
                  aria-pressed={isSelected}
                  onClick={() => onSelect?.(item.id)}
                  className={`w-full text-right rounded-[14px] border border-border ${color} p-6 h-24 md:h-28 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring hover:scale-[1.01] ${isSelected ? "ring-2 ring-primary scale-[1.02]" : ""}`}
                >
                  <span className="block truncate text-foreground/70 text-xs mb-1">المجموعة</span>
                  <span className="block truncate text-xl font-semibold text-foreground">{item.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WalletStack;

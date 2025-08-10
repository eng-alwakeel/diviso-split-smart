import React from "react";

export interface WalletItem {
  id: string;
  name: string;
}

interface WalletStackProps {
  items: WalletItem[];
  onSelect?: (id: string) => void;
}

// Apple Wallet-style stacked cards showing only the group name
export const WalletStack: React.FC<WalletStackProps> = ({ items, onSelect }) => {
  return (
    <div className="relative">
      <div aria-label="قائمة المجموعات" role="list" className="space-y-0">
        {items.map((item, idx) => {
          const z = items.length - idx; // higher z-index on top
          const negativeOffset = idx === 0 ? 0 : -24; // px overlap between cards
          return (
            <div
              key={item.id}
              role="listitem"
              className="relative"
              style={{ zIndex: z, marginTop: negativeOffset }}
            >
              <button
                type="button"
                aria-label={item.name}
                onClick={() => onSelect?.(item.id)}
                className="w-full text-right rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="block truncate text-foreground font-medium">{item.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WalletStack;

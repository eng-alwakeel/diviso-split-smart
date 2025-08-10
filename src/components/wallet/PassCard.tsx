import React from "react";

interface PassCardProps {
  title: string;
  subtitle?: string;
  amount?: number;
  currency?: string;
  onClick?: () => void;
}

export const PassCard: React.FC<PassCardProps> = ({ title, subtitle, amount, currency = "ر.س", onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative min-w-[260px] md:min-w-[300px] rounded-3xl border border-border/50 bg-gradient-card shadow-elevated p-5 md:p-6 backdrop-blur text-left transition-all duration-200 hover:shadow-accent hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring snap-start"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-extrabold truncate">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
        </div>
        {typeof amount === "number" && (
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-black text-accent leading-none">
              {amount.toLocaleString()}
              <span className="ml-1 text-xs md:text-sm font-semibold text-muted-foreground align-middle">{currency}</span>
            </p>
          </div>
        )}
      </div>
    </button>
  );
};

export default PassCard;

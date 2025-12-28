import { useTranslation } from "react-i18next";
import { Sparkles, ChevronLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickRecommendationProps {
  recommendation: {
    id: string;
    name: string;
    name_ar?: string | null;
    category?: string | null;
    rating?: number | null;
    price_range?: string | null;
  };
  onView?: (id: string) => void;
  className?: string;
}

export function QuickRecommendation({
  recommendation,
  onView,
  className,
}: QuickRecommendationProps) {
  const { t, i18n } = useTranslation("recommendations");
  const isRTL = i18n.language === "ar";
  
  const displayName = isRTL && recommendation.name_ar 
    ? recommendation.name_ar 
    : recommendation.name;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-lg",
        "bg-card/50 border border-border/50 hover:bg-card/80",
        "transition-all duration-200 cursor-pointer group",
        className
      )}
      onClick={() => onView?.(recommendation.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {displayName}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {recommendation.category && (
              <span>{t(`categories.${recommendation.category.toLowerCase()}`, recommendation.category)}</span>
            )}
            {recommendation.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>{recommendation.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground group-hover:text-primary"
      >
        <ChevronLeft className={cn("h-4 w-4", !isRTL && "rotate-180")} />
      </Button>
    </div>
  );
}

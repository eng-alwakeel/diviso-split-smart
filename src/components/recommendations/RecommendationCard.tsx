import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  MapPin, 
  Star, 
  ExternalLink, 
  Plus, 
  X, 
  DollarSign,
  Utensils,
  Hotel,
  Coffee,
  ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartnerBadge } from "./PartnerBadge";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: {
    id: string;
    name: string;
    name_ar?: string | null;
    category?: string | null;
    rating?: number | null;
    price_range?: string | null;
    estimated_price?: number | null;
    currency?: string | null;
    relevance_reason?: string | null;
    relevance_reason_ar?: string | null;
    is_partner?: boolean | null;
    affiliate_url?: string | null;
    location?: {
      address?: string;
      lat?: number;
      lng?: number;
    } | null;
  };
  onAddAsExpense?: (recommendation: any) => void;
  onOpenLocation?: (recommendation: any) => void;
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

const categoryIcons: Record<string, any> = {
  food: Utensils,
  restaurant: Utensils,
  accommodation: Hotel,
  hotel: Hotel,
  cafe: Coffee,
  coffee: Coffee,
  shopping: ShoppingBag,
};

export function RecommendationCard({
  recommendation,
  onAddAsExpense,
  onOpenLocation,
  onDismiss,
  isLoading = false,
  className,
}: RecommendationCardProps) {
  const { t, i18n } = useTranslation("recommendations");
  const [isDismissing, setIsDismissing] = useState(false);
  
  const isRTL = i18n.language === "ar";
  const displayName = isRTL && recommendation.name_ar ? recommendation.name_ar : recommendation.name;
  const displayReason = isRTL && recommendation.relevance_reason_ar 
    ? recommendation.relevance_reason_ar 
    : recommendation.relevance_reason;

  const CategoryIcon = categoryIcons[recommendation.category?.toLowerCase() || ""] || Utensils;

  const handleDismiss = async () => {
    setIsDismissing(true);
    await onDismiss?.(recommendation.id);
  };

  const renderPriceRange = () => {
    if (recommendation.estimated_price) {
      return (
        <span className="text-sm text-muted-foreground">
          {recommendation.estimated_price} {recommendation.currency || "SAR"}
        </span>
      );
    }
    if (recommendation.price_range) {
      return (
        <span className="text-sm text-muted-foreground">
          {recommendation.price_range}
        </span>
      );
    }
    return null;
  };

  return (
    <Card 
      className={cn(
        "unified-card overflow-hidden transition-all duration-300",
        isDismissing && "opacity-50 scale-95",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CategoryIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {displayName}
              </h3>
              {recommendation.category && (
                <Badge variant="outline" className="text-xs mt-1">
                  {t(`categories.${recommendation.category.toLowerCase()}`, recommendation.category)}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDismiss}
            disabled={isLoading || isDismissing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rating and Price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            {recommendation.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium">{recommendation.rating.toFixed(1)}</span>
              </div>
            )}
            {renderPriceRange() && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                {renderPriceRange()}
              </div>
            )}
          </div>
          
          {recommendation.is_partner && <PartnerBadge />}
        </div>

        {/* Location */}
        {recommendation.location?.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{recommendation.location.address}</span>
          </div>
        )}

        {/* Relevance Reason */}
        {displayReason && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-foreground/80">
              <span className="font-medium text-primary">{t("why_suitable")}: </span>
              {displayReason}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onAddAsExpense?.(recommendation)}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          {t("add_as_expense")}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => onOpenLocation?.(recommendation)}
          disabled={isLoading}
        >
          <ExternalLink className="h-4 w-4" />
          {t("open_location")}
        </Button>
      </CardFooter>
    </Card>
  );
}

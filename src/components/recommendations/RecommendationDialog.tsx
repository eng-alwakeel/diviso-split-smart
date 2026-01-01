import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { RecommendationCard } from "./RecommendationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface RecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  } | null;
  onAddAsExpense?: (recommendation: any) => void;
  onOpenLocation?: (recommendation: any) => void;
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
}

export function RecommendationDialog({
  open,
  onOpenChange,
  recommendation,
  onAddAsExpense,
  onOpenLocation,
  onDismiss,
  isLoading = false,
}: RecommendationDialogProps) {
  const { t, i18n } = useTranslation("recommendations");
  const isRTL = i18n.language === "ar";

  const handleAddAsExpense = (rec: any) => {
    onAddAsExpense?.(rec);
    onOpenChange(false);
  };

  const handleOpenLocation = (rec: any) => {
    onOpenLocation?.(rec);
  };

  const handleDismiss = (id: string) => {
    onDismiss?.(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="p-4 pb-2 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("notifications.default_title")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          ) : recommendation ? (
            <RecommendationCard
              recommendation={recommendation}
              onAddAsExpense={handleAddAsExpense}
              onOpenLocation={handleOpenLocation}
              onDismiss={handleDismiss}
              className="border-0 shadow-none p-0"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("errors.fetch_failed")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

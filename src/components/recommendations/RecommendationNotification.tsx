import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecommendationNotificationProps {
  type: "lunch" | "dinner" | "planning" | "post_expense";
  placeName?: string;
  onViewRecommendation?: () => void;
  onDismiss?: () => void;
  className?: string;
  autoHideAfter?: number; // milliseconds
}

export function RecommendationNotification({
  type,
  placeName,
  onViewRecommendation,
  onDismiss,
  className,
  autoHideAfter = 30000, // 30 seconds default
}: RecommendationNotificationProps) {
  const { t } = useTranslation("recommendations");
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (autoHideAfter > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideAfter);
      return () => clearTimeout(timer);
    }
  }, [autoHideAfter]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) return null;

  const getNotificationContent = () => {
    switch (type) {
      case "lunch":
        return {
          title: t("notifications.lunch_time"),
          subtitle: placeName ? t("notifications.suggested_place", { name: placeName }) : t("notifications.find_place"),
        };
      case "dinner":
        return {
          title: t("notifications.dinner_time"),
          subtitle: placeName ? t("notifications.suggested_place", { name: placeName }) : t("notifications.find_place"),
        };
      case "planning":
        return {
          title: t("notifications.planning"),
          subtitle: t("notifications.planning_subtitle"),
        };
      case "post_expense":
        return {
          title: t("notifications.post_expense"),
          subtitle: t("notifications.post_expense_subtitle"),
        };
      default:
        return {
          title: t("notifications.default_title"),
          subtitle: t("notifications.default_subtitle"),
        };
    }
  };

  const content = getNotificationContent();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 transition-all duration-300",
        isExiting && "opacity-0 translate-y-2 scale-95",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{content.title}</h4>
            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-primary hover:text-primary hover:bg-primary/10"
            onClick={onViewRecommendation}
          >
            {t("view")}
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar for auto-hide */}
      {autoHideAfter > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10">
          <div 
            className="h-full bg-primary/50 animate-shrink-width"
            style={{
              animationDuration: `${autoHideAfter}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}

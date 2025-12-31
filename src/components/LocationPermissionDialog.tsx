import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Utensils, Hotel, PartyPopper, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocationPermissionDialogProps {
  open: boolean;
  onAllow: () => Promise<boolean>;
  onDismiss: () => void;
}

export function LocationPermissionDialog({
  open,
  onAllow,
  onDismiss,
}: LocationPermissionDialogProps) {
  const { t, i18n } = useTranslation("recommendations");
  const isRTL = i18n.language === "ar";
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await onAllow();
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Utensils,
      text: t("location.benefit_restaurants"),
    },
    {
      icon: Hotel,
      text: t("location.benefit_hotels"),
    },
    {
      icon: PartyPopper,
      text: t("location.benefit_activities"),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent 
        className="sm:max-w-md"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("location.title")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {t("location.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <benefit.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={handleAllow} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className={isRTL ? "mr-2" : "ml-2"}>
                  {t("location.loading")}
                </span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span className={isRTL ? "mr-2" : "ml-2"}>
                  {t("location.allow_button")}
                </span>
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onDismiss}
            disabled={loading}
            className="w-full text-muted-foreground"
          >
            <X className="w-4 h-4" />
            <span className={isRTL ? "mr-2" : "ml-2"}>
              {t("location.skip_button")}
            </span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          {t("location.privacy_note")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
